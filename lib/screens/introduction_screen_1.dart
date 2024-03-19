import 'package:flutter/material.dart';
import 'introduction_screen_2.dart';


class IntroductionScreen1 extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('QRoll'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              'Welcome to QRoll\nPlease give access your Camera so that you can mark\nyour attendance by scanning the QR Code',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => IntroductionScreen2()),
                );
              },
              child: Text('Next'),
            ),
          ],
        ),
      ),
    );
  }
}