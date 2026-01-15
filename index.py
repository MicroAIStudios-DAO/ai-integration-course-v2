from backend.main import create_app

app = create_app()

# This is the WSGI entry point for platforms like Vercel or App Hosting.
if __name__ == "__main__":
    app.run()
