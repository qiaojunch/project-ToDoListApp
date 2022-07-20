//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); // use mongoose
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// connect the app to a cloud database call "todolistDB" if not exists it will create one
mongoose.connect("mongodb+srv://qiaojunch:test123@cluster0.fojdtpa.mongodb.net/todolistDB")

// create data schema
const itemSchema = {
    name: String
};
// create mongoose Model: to insert, find, delete data
const Item = mongoose.model("Item", itemSchema);

const listSchema = {
    name: String,
    items: [itemSchema]
}
const List = mongoose.model("List", listSchema);

// create new items
const item1 = {
    name: "welcome to use todolist"
}
const item2 = {
    name: "click on + to add a todo item"
}
const item3 = {
    name: "<-- hit this to delete item"
}
const defaultItems = [item1, item2, item3];




app.get("/", function(req, res) {
    // find: return array of objects
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            // insert default docs to database
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully save default items to DB");
                }
            });
            res.redirect("/"); // must be inside of insertMany!
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    });

});


app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list; // list to which we want to add a new item

    const item = new Item({
        name: itemName
    })

    // if list is the home route
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        // find the desired list
        List.findOne({name: listName}, function(err, foundList) {
            if (!err) {
                if (foundList) {
                    // add new item to list
                    foundList.items.push(item);
                    foundList.save();

                    res.redirect("/" + listName);
                }
            }
        });
    }
})

app.post("/delete", function(req, res) {
    const checkedId = req.body.checkbox;
    const listName = req.body.listName;

    // delete item from today list
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedId, function(err) {
            if (!err) {
                console.log("Remove Successfully!");
            }
        });
        res.redirect("/");
    } else {  // delete item from customed list
        const filter = {name: listName};  // find the list by listName
        const update = {$pull: {items: {_id: checkedId}}}; // remove a item from array by given id

        // return a document before update
        List.findOneAndUpdate(filter, update, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }

});

// get express dynamic route parameter
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName); // convert 1st letter to uppercase
    //console.log(customListName);

    // findOne: return AN object
    List.findOne({name: customListName}, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                // create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                // goto the new route
                res.redirect("/" + customListName);
            } else {
                // show existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });
});



// app.post("/", function(req, res){
//
//   const item = req.body.newItem;
//
//   if (req.body.list === "Work") {
//     workItems.push(item);
//     res.redirect("/work");
//   } else {
//     items.push(item);
//     res.redirect("/");
//   }
// });

// make port asigned by heroku server on clould
const port = process.env.PORT;
if (port === NULL || ""){
    port = 3000;  // localhost port if not connect to the cloud
}

app.listen(port, function() {
    console.log("Server started successfully");
});
