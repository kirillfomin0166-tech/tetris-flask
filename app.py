# app.py
import os
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def menu():
    return render_template("menu.html")

@app.route("/game")
def game():
    return render_template("game.html")

@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    # Render (и другие хостинги) задают порт в env PORT
    port = int(os.environ.get("PORT", 5000))
    # слушать на 0.0.0.0 обязательно, чтобы доступ был извне
    app.run(host="0.0.0.0", port=port)
