import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//setting up database connection pool
const pool = mysql.createPool({
    host: "etdq12exrvdjisg6.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "u2e1b4nobcvtvefh",
    password: "rgiu9nm274aqgtb6",
    database: "i6u2e2686luc9yc6",
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', (req, res) => {
   res.render('index');
});

app.get("/author/new", (req, res) => {
    res.render("newAuthor");
});

app.get("/quotes", async function( req, res){
    let sql = `SELECT q_quotes.quoteId,
                      q_quotes.quote,
                      q_quotes.authorId,
                      q_authors.firstName,
                      q_authors.lastName
               FROM q_quotes
               JOIN q_authors
                 ON q_quotes.authorId = q_authors.authorId
               ORDER BY q_quotes.quoteId`;
    const [rows] = await pool.query(sql);
    res.render("quoteList", {"quotes":rows});
});

app.get("/quote/edit", async function(req, res){
    let quoteId = req.query.quoteId;
    let quoteSql = `SELECT *
                FROM q_quotes
                WHERE quoteId = ${quoteId}`;

    let authorSql = `SELECT *
                    FROM q_authors
                    ORDER BY lastName`;
    const [quoteRows] = await pool.query(quoteSql);
    const [authorRows] = await pool.query(authorSql);
    res.render("editQuote", {quoteInfo : quoteRows, authors: authorRows});
});

app.post("/quote/edit", async function(req, res){
    let sql = `UPDATE q_quotes
                SET quote = ?,
                authorId = ?,
                category = ?,
                likes = ?
                WHERE quoteId =  ?`;
    let params = [req.body.quote, req.body.authorId, req.body.category, req.body.likes, req.body.quoteId];
    const [rows] = await pool.query(sql, params);
    res.redirect("/quotes");
})

app.get("/quote/new", async function(req, res){
    let sql = `SELECT *
                FROM q_authors
                ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    res.render("newQuote", {authors: rows});
});

app.post("/quote/new", async function(req,res){
    let quote = req.body.quote;
    let authorId = req.body.authorId;
    let category = req.body.category;
    let likes = req.body.likes;

    let sql = `INSERT INTO q_quotes
                (quote, authorId, category, likes)
                VALUES (?, ?, ?, ?)`;
    let params = [quote, authorId, category, likes];
    const [rows] = await pool.query(sql, params);
    let authorSql = `SELECT *
                     FROM q_authors
                     ORDER BY lastName`;
    const [authorRows] = await pool.query(authorSql);
    res.render("newQuote", {
        message: "Quote added!",
        authors: authorRows});
});

app.post("/author/new", async function(req, res){
  let fName = req.body.fName;
  let lName = req.body.lName;
  let birthDate = req.body.birthDate;
  let deathDate = req.body.deathDate;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let portrait = req.body.portrait;
  let biography = req.body.biography;
  let sql = `INSERT INTO q_authors
             (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  let params = [fName, lName, birthDate, deathDate, sex, profession, country, portrait, biography];
  const [rows] = await pool.query(sql, params);
  res.render("newAuthor", 
             {"message": "Author added!"});
});

app.get("/authors", async function(req, res){
 let sql = `SELECT *
            FROM q_authors
            ORDER BY lastName`;
 const [rows] = await pool.query(sql);
 res.render("authorList", {"authors":rows});
});

app.get("/author/edit", async function(req, res){

 let authorId = req.query.authorId;

 let sql = `SELECT *, 
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
        DATE_FORMAT(dod, '%Y-%m-%d') dodISO
        FROM q_authors
        WHERE authorId =  ${authorId}`;
 const [rows] = await pool.query(sql);
 res.render("editAuthor", {"authorInfo":rows});
});

app.post("/author/edit", async function(req, res){
  let sql = `UPDATE q_authors
            SET firstName = ?,
                lastName = ?,
                dob = ?,
                dod = ?,
                sex = ?,
                profession = ?,
                country = ?,
                portrait = ?,
                biography = ?
            WHERE authorId =  ?`;

  let params = [req.body.fName,  
              req.body.lName, req.body.dob, req.body.dod,
              req.body.sex,req.body.profession, req.body.country, req.body.portrait,
              req.body.biography, req.body.authorId];         
  const [rows] = await pool.query(sql, params);
  res.redirect("/authors");
});

app.get("/author/delete", async function(req, res) {
    let authorId = req.query.authorId;

    let sql = `DELETE
                FROM q_authors
                WHERE authorId= ?`;

    const [rows] = await pool.query(sql, [authorId]);

    res.redirect("/authors");
});

app.get("/quote/delete", async function(req, res){
    let quoteId = req.query.quoteId;
    let sql = `DELETE
                FROM q_quotes
                WHERE quoteId = ?`;
    const [rows] = await pool.query(sql, [quoteId]);
    res.redirect("/quotes");
});

app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});//dbTest

app.listen(3000, ()=>{
    console.log("Express server running")
})