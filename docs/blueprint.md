# **App Name**: QRoll

## Core Features:

- QR Code Generation: Generate a QR code on the teacher dashboard that refreshes every 3 seconds using a secure random token.
- QR Code Scanning: Scan QR codes with a React QR-reader component on the student dashboard and submit attendance records.
- Facial Recognition: Client captures webcam image and runs preliminary face detection/embedding via face-api.js. The server then verifies embeddings against stored student profiles using TensorFlow.js or a local face-api.js tool endpoint.

## Style Guidelines:

- Primary color: White (#FFFFFF) for a clean and modern look.
- Secondary color: Light gray (#F0F0F0) for backgrounds and subtle contrast.
- Accent: Teal (#008080) for interactive elements and highlights.
- Use a responsive grid layout to adapt to different screen sizes.
- Use modern and minimalist icons for navigation and actions.