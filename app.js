require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connect = require("./lib/connect");
const Note = require("./models/Note");
const User = require("./models/User");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  await connect();
  const notes = await Note.find().populate("user", "name");

  if (!notes.length) {
    return res.json({ message: "Note not found" });
  }

  return res.json(notes.map((note) => ({ ...note._doc, id: note._id })));
});

app.get("/:user", async (request, response) => {
  await connect();
  const { user } = request.params;

  const { _id: userId } = (await User.findOne({ name: user })) || { _id: null };

  if (!userId) {
    return response.json({ message: "That user doesn't exist." });
  }

  const notes = await Note.find({ user: userId }).populate("user", "name");

  if (!notes.length) {
    return response.json({ error: "Note not found." });
  }

  return response.json(notes.map((note) => ({ ...note._doc, id: note._id })));
});

app.get("/:user/:id", async (request, response) => {
  await connect();
  const { user, id } = request.params;

  const { _id: userId } = (await User.findOne({ name: user })) || { _id: null };

  if (!userId) {
    return res.json({ message: "That user doesn't exist." });
  }

  const notes = await Note.find({ _id: id }).populate("user", "name");

  if (!notes.length) {
    return response.json({ error: "Note not found." });
  }

  return response.json(
    notes.map((note) => ({ ...note._doc, id: note._id }))[0]
  );
});

app.post("/:user", async (request, response) => {
  await connect();
  const { user } = request.params;

  if (user) {
    let { _id: userId } = (await User.findOne({ name: user })) || { _id: null };

    if (!userId) {
      const { _id: newUserId } = (await User.create({ name: user })) || {
        _id: null,
      };
      userId = newUserId;
    }

    const { content } = request.body;

    if (userId && content) {
      const { _id } = (await Note.create({ content, user: userId })) || {
        _id: null,
      };
      response.json({ id: _id, message: "Successfully created note." });
    } else {
      response.json({
        error: "Note NOT created. Content and/or id is missing.",
      });
    }
  }
});

/* vegan delete route */
app.delete("/:user/:tofu", async (request, response) => {
  await connect();
  const { user, tofu } = request.params;

  const { _id: userId } = (await User.findOne({ name: user })) || { _id: null };

  if (!userId) {
    return res.json({ message: "That user doesn't exist." });
  }

  const { acknowledged, deletedCount } = (await Note.deleteOne({
    _id: tofu,
  })) || { acknowledged: null, deletedCount: null };

  if (!acknowledged || !deletedCount) {
    return response.json({ error: "Note not found." });
  }

  response.json({ message: "Successfully deleted note." });
});

app.put("/:user/:id", async (req, res) => {
  await connect();
  const { user, id } = req.params;
  const { content } = req.body;

  const { _id: userId } = (await User.findOne({ name: user })) || { _id: null };

  if (!userId) {
    return res.json({ message: "That user doesn't exist." });
  }

  const updatedNoteResponse = await Note.findOneAndUpdate(
    { _id: id },
    { content }
  );

  if (!updatedNoteResponse) {
    return res.json({ error: "Note not updated." });
  }

  return res.json("Successfully edited the note.");
});

// default catch-all handler
app.get("*", (request, response) => {
  response.status(404).json({ message: "Route not defined" });
});

const server = app.listen(port, () =>
  console.log(`Express app listening on port ${port}!`)
);

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
