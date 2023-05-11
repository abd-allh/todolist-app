const express = require("express");
const mongoose = require("mongoose");
const { Item, List, defaultItems } = require("./Model");

require('dotenv').config({path : 'vars/.env'});
const MUSER = process.env.USER;
const MPASS = process.env.PASS;

const app = express();
const port = process.env.PORT || 3000;
const uri ="mongodb+srv://" + MUSER + ":" + MPASS + "@abdallah.qb7z6xt.mongodb.net/todolistDB?retryWrites=true&w=majority";

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(uri);
}

app.get("/", async function (req, res) {
  const foundItems = await Item.find({});

  if (!(await Item.exists())) {
    await Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = req.params.customListName;

  const foundList = await List.findOne({ name: customListName });

  if (!foundList) {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    await list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    await newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(newItem);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today" && checkedItemId != undefined) {
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate( { name: listName },
      { $pull: { items: { _id: checkedItemId } } } );
    res.redirect("/" + listName);
  }
});

app.listen(port, function (err) {
  if (err) console.log(err);
  console.log(`Listening on PORT ${port}.`);
});