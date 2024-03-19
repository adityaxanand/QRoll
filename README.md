# QRoll

QRoll is a modern mobile application designed to modernize the traditional attendance marking process using QR codes, geolocation, and facial recognition features to ensure genuine attendance.

## Getting Started

To get started with QRoll, follow these steps:

1. Install Flutter: QRoll is a Flutter application. To install Flutter, follow the instructions on the official [Flutter website](https://flutter.dev/).
2. Clone the QRoll repository: Clone the QRoll repository from [GitHub](https://github.com/).
3. Install dependencies: Navigate to the QRoll directory and run `flutter pub get` to install the required dependencies.
4. Run the application: Run `flutter run` to start the application.

## Features

- **QR Code Scanner:** QRoll uses QR code scanning to mark attendance, streamlining the process and making it faster and more convenient for both teachers and students.
- **Geolocation:** QRoll includes a geolocation feature that ensures students mark their attendance from the correct location, preventing proxy attendance.
- **Facial Recognition:** QRoll uses facial recognition to ensure the right student is attending class, preventing fake attendance.
- **Teacher Dashboard:** The teacher dashboard displays a list of classes and generates QR codes for each class. The QR code refreshes every 3 seconds to prevent early attendance marking.
- **Student Dashboard:** The student dashboard displays a list of classes for the day and allows students to mark their attendance by scanning the QR code.

## Unique Selling Points

- **Secure Attendance:** QRoll ensures genuine attendance by using QR codes along with geolocation and facial recognition features.
- **Easy to Use:** QRoll simplifies the attendance marking process, making it quicker and more convenient for students and teachers.
- **Accurate:** QRoll's facial recognition technology ensures that only the real student is attending class, eliminating the possibility of fake attendance.
- **Real-time Tracking:** QRoll's QR code refreshes every 3 seconds, ensuring that students can only mark their attendance when they are actually present in the class.

## Why Not Proxy or Fake Attendance

QRoll has several features that prevent fake attendance and proxy attendance:

- **Geolocation:** QRoll uses geolocation to ensure that students mark their attendance from the correct location, making proxy attendance impossible.
- **Facial Recognition:** QRoll uses facial recognition to ensure that the student attending class is the actual person, preventing fake attendance.

## Conclusion

QRoll is a modern, secure, and easy-to-use mobile application that simplifies the attendance marking process and ensures genuine attendance. By using QR codes, geolocation, and facial recognition features, QRoll offers a reliable and efficient solution for marking attendance in educational institutions.

## Contact

For any questions or suggestions regarding qroll, please contact us at [qroll.mail@gmail.com](mailto:qroll.mail@gmail.com).

## Contributing

Any contributions to improve qroll are welcome. To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make the changes and commit them.
4. Create a pull request.

## License

QRoll is open-source and is licensed under the [MIT License](https://github.com/<username>/qroll/blob/main/LICENSE).

## Note

The above instructions are for demonstration purposes only. Please replace `<username>` with your actual GitHub username in the code. Additionally, the `home_screen.dart` code was not provided in this readme file; it should be integrated as needed for the QRoll application to function correctly.

## Example Usage

To use QRoll in your Flutter project, here is an example of how to add it to your `pubspec.yaml` file:

```yaml
dependencies:
  flutter:
    sdk: flutter
  qroll: ^0.0.1
```
# Here is an example how you can you can se it in your app
```
import 'package:flutter/material.dart';
import 'package:qroll/qroll.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'qroll',
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // Add your implementation for the home screen here
}
```
