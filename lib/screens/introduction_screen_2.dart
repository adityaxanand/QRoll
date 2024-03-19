import 'package:flutter/material.dart';

class IntroductionScreen2 extends StatelessWidget {
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
              'A secure solution!\nPlease give access to your location so that we can\nrecord your genuine attendance',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              //get access of location after pressing this get started button
              onPressed: () {
                Navigator.pushNamed(context, '/location');
              },
              child: Text('Get Started'),
            ),
          ],
        ),
      ),
    );
  }
}