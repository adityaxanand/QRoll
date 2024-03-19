import 'package:flutter/material.dart';
import 'screens/introduction_screen_1.dart';
import 'screens/introduction_screen_2.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'QRoll',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: IntroductionScreen1(),
      routes: {
        '/location': (context) => IntroductionScreen1(),
      },
    );
  }
}