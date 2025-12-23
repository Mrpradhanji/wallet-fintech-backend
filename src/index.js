require("dotenv").config();
const express = require('express')
const cors = require('cors')
const db = require("./db")
const routesCategories = require("./routes/categories");
const routesUser = require("./routes/users");
const routesFinances = require("./routes/finances");
const routesTransfers = require("./routes/transfers");

const app = express();
app.use(cors({
  origin: '*',
})
);
app.use(express.json());

const port = 3000;

app.get('/', (req, res) => {
  res.send('Olá, essa é a aplicação Wallet App')
});

app.use("/api/categories", routesCategories);
app.use("/api/users", routesUser);
app.use("/api/finances", routesFinances);
app.use("/api/transfers", routesTransfers);

app.get ("/categories", (req, res) => {
  db.query("SELECT * FROM categories", (error, response) => {
    if(error) {
      return res.status(500).json(error);
    } 

    return res.status(200).json(response.rows);
  });

});

app.listen(port, () => {
  db.connect().then(() => {
    console.log("DB connected");
  }).catch((error) => {
    throw new Error(error);
  });
  console.log(`Example app listening on port ${port}`);
});