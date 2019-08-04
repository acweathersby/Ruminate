const path = require("path");
const fs = require("fs");
const fsp = fs.promises

async function start() {
    const file = await fsp.readFile(path.resolve(process.env.PWD, "./test/data/war_and_peace.formatted.txt"), "utf8")
    const titles = file.match(/Book \w{0,15}\:[^\n]*|(First|Second) Epilogue\:?([^\n]*)/g)

    const war_and_peace = file
        .split("((book))")
        .map(s => s.trim())
        .map(s =>
            s.split("((chapter))")
        ).map(chapters => ({
            title: chapters[0].trim(),
            chapters: chapters
                .slice(1)
                .map((c, i) => {
                    const paragraphs = c.split("((para))").map(e => e.trim())
                    return {
                        chapter: i + 1,
                        paragraphs: paragraphs.filter(s => s[0] !== "*"),
                        footnotes: paragraphs.filter(s => s[0] === "*").map(f => f.slice(2))
                    }
                })
        }))

    const output = { data: [] };
    const data = output.data;

    war_and_peace.forEach((book, b_index) => {
        data.push({
            id: `book ${b_index+1}.title`,
            meta: [b_index+1, "book", "title"],
            body: book.title
        })

        book.chapters.forEach((chapter, c_index) => {
            chapter.paragraphs.forEach((paragraph, p_index) => {
                data.push({
                    id: `book ${b_index+1}.chapter ${c_index+1}.paragraph ${p_index+1}`,
                    meta: [p_index+1, book.title, "chapter"],
                    body: paragraph
                })
            })

            chapter.footnotes.forEach((footnote, f_index) => {
                data.push({
                    id: `book ${b_index+1}.chapter ${c_index+1}.footnote ${f_index+1}`,
                    meta: [f_index, book.title, "footnote"],
                    body: footnote
                })
            })
        })
    })

    fsp.writeFile(path.resolve(process.env.PWD, "./test/data/war_and_peace.data.json"), JSON.stringify(output));
}

start()
