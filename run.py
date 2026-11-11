"""Titik masuk lokal: flask --app run run --debug"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
