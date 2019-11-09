#include "database/include/db_runner.h"
#include "text_command/text_command.h"

#include <boost/asio.hpp>
#include <boost/bind.hpp>
#include <boost/enable_shared_from_this.hpp>
#include <boost/shared_ptr.hpp>
#include <ctime>
#include <iostream>
#include <string>

#define EOT ((char) 4)

namespace RUMINATE
{
    namespace NETWORK
    {

        using boost::asio::basic_stream_socket;
        using boost::asio::ip::tcp;

        class TCPConnection : public boost::enable_shared_from_this<TCPConnection>
        {
          public:
            typedef boost::shared_ptr<TCPConnection> pointer;

          private:
            boost::asio::io_context & io_context;

            tcp::socket priv_socket;

            boost::asio::streambuf in_buffer;
            boost::asio::streambuf out_buffer;

            RUMINATE::DB::DBRunner & runner;

            RUMINATE::COMMAND::TextCommandResult * result = nullptr;

            TCPConnection(boost::asio::io_context & ioc, RUMINATE::DB::DBRunner & r)
                : io_context(ioc), priv_socket(ioc), runner(r)
            {
            }

            void handle_write(const boost::system::error_code & error /*error*/, size_t /*bytes_transferred*/)
            {
                std::cout << "Write Error Code" << error.value() << std::endl;
            }

            void handle_read(const boost::system::error_code & error /*error*/, size_t /*bytes_transferred*/ size)
            {
                std::cout << "Read Error Code" << error.value() << std::endl;

                std::cout << "GETTING DATA " << size << std::endl;

                std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;

                in_buffer.commit(size);

                std::istream istr(&in_buffer);

                std::string str(std::istreambuf_iterator<char>(istr), {});

                wstring wstr = converter.from_bytes(str.substr(0, size - 1));

                RUMINATE::COMMAND::runStringCommand(wstr, runner, &result);

                boost::asio::post(io_context, boost::bind(&TCPConnection::wait_for_result, shared_from_this()));
            };

            void wait_for_result()
            {
                if (result) {
                    if (!result->READY())
                        boost::asio::post(io_context, boost::bind(&TCPConnection::wait_for_result, shared_from_this()));
                    else {
                        auto & r = *result;

                        std::wcout << r << endl;

                        std::ostream str(&out_buffer);

                        str << "{ \"result_info\": {";

                        str << "\"message\": \"" << r << "\"";

                        str << ",\"note_count\":" << r.size();

                        str << "},\"notes\":[";

                        if (r.size() > 0) {

                            r[0].toJSONString(str);

                            for (int i = 1; i < r.size(); i++) {
                                str << ",";
                                r[i].toJSONString(str);
                            }
                        }

                        str << "]}";

                        boost::asio::async_write(priv_socket, out_buffer,
                                                 boost::bind(&TCPConnection::handle_write, shared_from_this(),
                                                             boost::asio::placeholders::error,
                                                             boost::asio::placeholders::bytes_transferred));

                        result = nullptr;
                    }
                }
            }

            void startRead()
            {
                boost::asio::async_read_until(priv_socket, in_buffer, EOT,
                                              boost::bind(&TCPConnection::handle_read, shared_from_this(),
                                                          boost::asio::placeholders::error,
                                                          boost::asio::placeholders::bytes_transferred));
            }

          public:
            static pointer create(boost::asio::io_context & io_context, RUMINATE::DB::DBRunner & runner)
            {
                return pointer(new TCPConnection(io_context, runner));
            }

            tcp::socket & socket() { return priv_socket; }

            void start()
            {
                // wait for input from listener
                startRead();
            }
        };

        class Server
        {
          public:
            boost::asio::io_context io_context;
            tcp::acceptor acceptor;
            RUMINATE::DB::DBRunner & runner;

          public:
            Server(RUMINATE::DB::DBRunner & r, unsigned port = 13)
                : acceptor(io_context, tcp::endpoint(tcp::v4(), port)), runner(r)
            {
                try {
                    start_accept();
                } catch (std::exception & e) {
                    std::cerr << e.what() << std::endl;
                }
            }

            void run() { io_context.run(); }

          private:
            void start_accept()
            {
                TCPConnection::pointer new_connection = TCPConnection::create(io_context, runner);

                acceptor.async_accept(
                    new_connection->socket(),
                    boost::bind(&Server::handle_accept, this, new_connection, boost::asio::placeholders::error));
            }

            void handle_accept(TCPConnection::pointer new_connection, const boost::system::error_code & error)
            {
                if (!error) new_connection->start();

                start_accept();
            }
        };
    } // namespace NETWORK
} // namespace RUMINATE
