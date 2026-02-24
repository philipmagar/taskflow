const express  = require('express');

const app = express();

app.use(express.json());

app.use ('/api/v1',(req,res) => {
    res.json({message: "task flow api running successfully"});
});

module.exports = app;