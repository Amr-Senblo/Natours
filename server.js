const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// for example console.log(x);   and x is not defind
// process.on('uncaughtException', err => {
//   console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//   console.log(err.name, err.message);
//   process.exit(1);
// });

const app = require('./app');

const mongoose = require('mongoose');
const DB = process.env.DATABASE.replace('<password>', process.env.PASSWORD);  //link offered by mongodb atlas

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(con =>
    // console.log(con.connections)
    console.log('DB connection successful !')
  );

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// for example error in connecting to the data base
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  //server.close()  =====>>>> stop accepting new connections and complete any ongoing requests before shutting down.
  server.close(() => {
    process.exit(1);
  });
});
