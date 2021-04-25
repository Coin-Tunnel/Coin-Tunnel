module.exports = (app) => {
    // '/'
    app.use('/', require('./routes/index'));

    app.use('/create', require('./routes/index'));
    app.use(function(req, res) {
      res.render('404_error');
    });
}