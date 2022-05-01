use std::{fs::File, io::{Write, Read, Result, Error, ErrorKind}};

/// Convert underlying data to and from a serial binary layout.
pub trait BinaryStream where Self: Sized {

    fn write_to_file(&self, file:&mut File) -> Result<()>;

    fn read_from_file(file:&mut File) -> Result<Self>;
}  


impl BinaryStream for Vec<u8> {

    fn read_from_file(file:&mut File) -> Result<Self> {

        let mut buf: [u8;4] = [0;4];

        file.read_exact(&mut buf)?;
               
        let size = u32::from_le_bytes(buf) as usize;

        if size > 0 {
            let mut vec = Vec::<u8>::with_capacity(size);

            file.read_exact(&mut vec.as_mut_slice())?;

            Ok(vec)

        } else {
            Ok(vec![])
        }                                                
    }

    fn write_to_file(&self, file:&mut File) -> Result<()> {

        let size = self.len();

        file.write(&size.to_le_bytes());

        let len_written = file.write(self.as_slice())?;

        if len_written != size {
            Err(Error::new(ErrorKind::BrokenPipe, "Could not write all of binary data"))
        }else{
            Ok(())
        }
    }


}