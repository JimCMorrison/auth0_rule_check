const express = require('express');
const app = express();
const port = 4000;

app.get('/', (req, res) => {
    res.send('Test');
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});