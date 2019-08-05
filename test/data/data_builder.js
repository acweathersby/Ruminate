const path = require("path");
const fs = require("fs");
const fsp = fs.promises

async function war_and_peace() {

    const output = { data: [] },
        data = output.data;

    (await fsp.readFile(path.resolve(process.env.PWD, "./test/data/war_and_peace.formatted.txt"), "utf8"))
        .split("((book))")
        .map(s => s.trim())
        .map(s => s.split("((chapter))"))
        .map(chapters => ({
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
        .forEach((book, b_index) => {
            data.push({
                id: `book ${b_index+1}/title`,
                meta: [b_index + 1, "book", "title"],
                body: book.title
            })

            book.chapters.forEach((chapter, c_index) => {
                chapter.paragraphs.forEach((paragraph, p_index) => {
                    data.push({
                        id: `book ${b_index+1}/chapter ${c_index+1}/paragraph ${p_index+1}`,
                        meta: [p_index + 1, book.title, "chapter"],
                        body: paragraph
                    })
                })

                chapter.footnotes.forEach((footnote, f_index) => {
                    data.push({
                        id: `book ${b_index+1}/chapter ${c_index+1}/footnote ${f_index+1}`,
                        meta: [f_index, book.title, "footnote"],
                        body: footnote
                    })
                })
            })
        })

    fsp.writeFile(path.resolve(process.env.PWD, "./test/data/war_and_peace.data.json"), JSON.stringify(output));
}

async function loc_film_registry() {

    const data = [],
        output = { data };

    (await fsp.readFile(path.resolve(process.env.PWD, "./test/data/library_of_congress_film_registry_essay.txt"), "utf8"))
        .split(/\n/g)
        .map(e => e.trim().split("|").map(e => e.trim()))
        .map(array =>
            data.push({
                id: `library of congress/film registry/essays/${array[0]}`,
                meta: [`Size:${array[3]}`, `URL:${array[2]}`, "essay"],
                body: `Name: ${array[0]} \n Author: ${array[1]} \n PDF: ${array[2]}`
            })
        );

    (await fsp.readFile(path.resolve(process.env.PWD, "./test/data/library_of_congress_film_registry.txt"), "utf8"))
        .split(/\n/g)
        .map(e => e.trim().split("|").map(e => e.trim()))
        .map(array =>
            data.push({
                id: `library of congress/film registry/films/${array[0]}`,
                meta: [`Released:${array[1]}`, `Selected:${array[2]}`, "film"],
                body: `Name: ${array[0]} \n Released: ${array[1]} \n Selected by the Library of Congress: ${array[2]}`
            })
        );

    fsp.writeFile(path.resolve(process.env.PWD, "./test/data/loc_film_registry.data.json"), JSON.stringify(output));
}

loc_film_registry();
war_and_peace();
