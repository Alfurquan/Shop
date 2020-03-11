const User = require("../models/user");
const bcrypt = require("bcryptjs");

bcrypt.hash('admin@123', 12).then(hashedPassword => {
    let user = {
        name: 'Admin User',
        email: "admin@gmail.com",
        role: "admin",
        password: hashedPassword,
        cart: { items: [] }

    }

    User.create(user, function (e) {
        if (e) {
            throw e;
        }
    });
}).catch(err => {
    console.log("err", err)
})

