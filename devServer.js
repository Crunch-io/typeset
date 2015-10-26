import path from 'path';
import express from 'express';

const app = express();

app.use(express.static('.'));

app.listen(3000, 'localhost', err => {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Listening at http://localhost:3000');
});
