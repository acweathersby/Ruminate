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
                        meta: [p_index + 1, book.title, "chapter", `book:${b_index+1}`],
                        body: paragraph
                    })
                })

                chapter.footnotes.forEach((footnote, f_index) => {
                    data.push({
                        id: `book ${b_index+1}/chapter ${c_index+1}/footnote ${f_index+1}`,
                        meta: [ f_index+1,`index:${f_index}`, book.title, "footnote", `chapter:${c_index+1}`, `book:${b_index+1}`],
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
        .slice(0,-1) // Last Line is empty
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
        .slice(0,-1) // Last Line is empty
        .map(e => e.trim().split("|").map(e => e.trim()))
        .map((array, i) =>
            data.push({
                id: `library of congress/film registry/films/${array[0]}`,
                meta: [`Released:${array[1]}`, `Selected:${array[2]}`, "film", "Identifier:"+i],
                body: `Name: ${array[0]}; Released: ${array[1]}; Selected by the Library of Congress: ${array[2]}; id:${i}`
            })
        );

    fsp.writeFile(path.resolve(process.env.PWD, "./test/data/loc_film_registry.data.json"), JSON.stringify(output));
}

async function US_population_2018_estimate(){
    const rows = (await fsp.readFile(path.resolve(process.env.PWD, "./test/data/2018USPopEstimates/PEP_2018_PEPANNRES_with_ann.csv"), "utf8"))
        .split(/\n/g)
        .map(r=>r.split("|").map(a=>a.trim()))
        .slice(0,-1); // Last Line is empty
    
    const headers = rows.shift();
    

    const data = rows.map( row => {
        const data = {};

        data.id = `/us census/population estimate 2018/${row[2]}`;
        data.meta = row.map((v,i)=>`${headers[i]}:${v}`);
        
        if(row[2] == "United States") data.meta.push("type:country", "country");
        else if(row[2] == "District of Columbia") data.meta.push("type:district");
        else if(row[2] == "Puerto Rico") data.meta.push("type:territory", "territory");
        else data.meta.push("type:state", "state");

        data.body = 
`In 2018 the United States Census Bureau estimated ${row[2]} had a population of ${row[9]} people in 2014.
The population was estimated to have ${row[13]-row[9] > 0 ? "grown" : "shrunk"} by ${Math.abs(row[13]-row[9])} persons by 2018, with a total population of ${row[13]} individuals.
In the 2010 US Census, the population of ${row[2]} was numbered at ${row[4]} Homo Sapiens.`;

        return data;
    })

    fsp.writeFile(path.resolve(process.env.PWD, "./test/data/us_2018_pop_estimate.data.json"), JSON.stringify({data}));
}

US_population_2018_estimate();
loc_film_registry();
war_and_peace();
