const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash"); //per trasformare testo inserito con prima lettera maiuscola//
app.set("view engine", "ejs");
//const port = 3000;tolgo perchè ho aggiunto riga 116//
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect(
  "mongodb+srv://admin-jessica:test123@atlascluster.fegkebw.mongodb.net/todolistDB"
); //{useNewUrlParser:true});se esce errore//
const itemSchema = {
  //creare un nuovo schema//
  name: String,
};
const Item = mongoose.model("Item", itemSchema); //creo nuova collezione, di solito il nome della collezione è maiuscolo//
//il primo valore (Item) deve ex singolare//
const item1 = new Item({
  //creo nuovi oggetti in collezione//
  name: "Welcome in your to do list",
});
const item2 = new Item({
  name: "Hit the + button to add a new item",
});
const item3 = new Item({
  name: "<--Hit this to delete an item",
});
const defaultItem = [item1, item2, item3]; //metto gli oggetti in array//
const listSchema = {
  //creo uno schema per più liste come home-work
  name: String,
  items: [itemSchema],
};
const List = mongoose.model("List", listSchema); //creo modello x liste diverse//

app.get("/", async (req, res) => {
  const listDay = await Item.find({}); //registro tt gli items all'interno della collezione nel mio db//
  if (listDay.length === 0) {
    //se la lista è vuota aggiungi item altrimenti no(per non ripeterli ogni volta che riavvio server)
    await Item.insertMany(defaultItem);
    res.redirect("/"); //entra nell if listDay è 0 lo riempie con insertMany reindirizzo a get ora listDay non è zero quindi entra nell else
  } else {
    res.render("index.ejs", { title: "Today", content: listDay }); //modifico la data in titolo//
  }
});

app.get("/:customListName", async (req, res) => {
  //customListName perchè voglio qualsiasi cosa l'utente decide di digitare dopo / può ex home o work!//
  const customListName = _.capitalize(req.params.customListName); //abbiamo accesso a quel che viene digitato dopo //
  //con _capitalize converto prima lettera in maiuscolo semprecosi da ex sicuri che finiro sempre nella stessa lsta sia che l utente digiti piccolo che grande
  const findList = await List.findOne({ name: customListName }); //trovo quel che già è stato digitato dall'utente qui /:customListName
  if (findList) {
    res.render("index.ejs", { title: findList.name, content: findList.items });
  } else {
    //se non fosse stato trovato un elenco con lo stesso nome creiamone uno
    const list = new List({
      //creo nuovo oggetto in lista che sarà ciò che l'utente digita dopo / (customListName) e item sono i valori predefiniti che ho salvato in precedenza
      name: customListName,
      items: defaultItem,
    });
    await list.save();
    res.redirect("/" + customListName); //ricarica la pagina aggiornata dopo che il nuovo :/ (categoria) viene salvata du DB//
  }
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list; //list e il nome del button in ejs//

  const item = new Item({
    //per aggiungere item digitato nel DB
    name: itemName,
  });
  if (listName === "Today") {
    //se listName cioè bottone è === a today salva il nuovo item immesso e rimanda alla pagina today//
    item.save();
    res.redirect("/");
  } else {
    //ma se non è = a today vuol dire che proviene da un elenco personalizzato, in quel caso dobbiamo cercare l'elenco nel db e aggiungere item nel giusto elenco //
    const findListName = await List.findOne({ name: listName });
    if (findListName) {
      findListName.items.push(item); //push il nuovo item//
      findListName.save();
      res.redirect("/" + listName);
    }
  }
});
app.post("/delete", async (req, res) => {
  //come cancellare dal db item che vengono checked
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});
/*app.post("/work", async (req, res) => {
  const listItem = req.body.newItem;
  try {
    if (listItem) {
      listWork.push(listItem);
      console.log(listWork);
      res.render("index1.ejs", { content: listWork });
    }
  } catch (error) {
    res.render("index1.ejs", { error: "Result not found" });
  }
});*/
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
