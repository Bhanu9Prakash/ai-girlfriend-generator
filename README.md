
# AI Girlfriend Generator

An AI-powered web application that generates realistic girlfriend photos based on user uploads. Built with Express.js and Google's Generative AI.

## Features

- Upload your photo and generate an AI girlfriend next to you
- Enhance generated images using CodeFormer AI
- Privacy-focused: all data stored locally in browser
- View and manage generation history
- Download original and enhanced versions
- Customizable prompts and preset options

## Tech Stack

- Node.js & Express
- Google Generative AI (Gemini)
- Replicate CodeFormer for image enhancement
- Local Storage for history management
- Multer for file uploads

## Getting Started

1. Clone this repl
2. Set up environment variables:
   - `GEMINI_API_KEY`: Google Generative AI API key
   - `REPLICATE_API_TOKEN`: Replicate API token for CodeFormer
3. Click the Run button

The application will be available on port 3000.

## Privacy

- No server-side storage of user images
- Images temporarily cached (1 hour max) for processing
- All history stored in browser's localStorage
- Automatic cleanup of temporary files

## License

ISC License
