// import 'package:flutter/material.dart';
// import 'package:qr_code_scanner/qr_code_scanner.dart';
// import 'package:http/http.dart' as http;
// import 'dart:convert';

// class HomeScreen extends StatefulWidget {
//   @override
//   _HomeScreenState createState() => _HomeScreenState();
// }

// class _HomeScreenState extends State<HomeScreen> {
//   QRViewController? _controller;
//   String? _qrCode;

//   @override
//   void initState() {
//     super.initState();
//     startQRCodeStream();
//   }

//   @override
//   void dispose() {
//     _controller?.dispose();
//     super.dispose();
//   }

//   void startQRCodeStream() async {
//     null; 'package:qr_code_scanner/qr_code_scanner.dart';
//     final qrCodeStream = QRCodeStream(
//       (Barcode barcode) {
//         setState(() {
//           _qrCode = barcode.code;
//         });
//       },
//       format: BarcodeFormat.qrcode,
//     );

//             _controller = QRViewController.scanner(
//               qrCodeStream: qrCodeStream,
//               cameraFacing: CameraFacing.back,
//               onQRViewCreated: (var controller) {
//                 _controller = controller;
//               },
//             );

//             _controller?.scannedDataStream?.listen((scanData) {
//               getQRCodeData(scanData.code);
//             });

//             _controller?.resumeCamera();
//           }

//           Future<void> getQRCodeData(String qrCode) async {
//             final response = await http.get(Uri.parse('https://qroll.com/api/qrcode/$qrCode'));

//             if (response.statusCode == 200) {
//               final json = jsonDecode(response.body);
//               final String className = json['class_name'];
//               final String classId = json['class_id'];
//               final String teacherName = json['teacher_name'];

//               // Display the class information in a dialog
//               showDialog(
//                 context: context,
//                 builder: (BuildContext context) {
//                   return AlertDialog(
//                     title: Text('Class Information'),
//                     content: Column(
//                       mainAxisSize: MainAxisSize.min,
//                       children: [
//                         Text('Class Name: $className'),
//                         Text('Class ID: $classId'),
//                         Text('Teacher Name: $teacherName'),
//                       ],
//                     ),
//                     actions: [
//                       TextButton(
//                         child: Text('OK'),
//                         onPressed: () {
//                           Navigator.of(context).pop();
//                         },
//                       ),
//                     ],
//                   );
//                 },
//               );

//               // Reset the QR code value
//               setState(() {
//                 _qrCode = null;
//               });
//             } else {
//               // Handle error
//             }
//           }

//           @override
//           Widget build(BuildContext context) {
//             return Scaffold(
//               appBar: AppBar(
//                 title: Text('QRoll'),
//               ),
//               body: Column(
//                 children: [
//                   Expanded(
//                     child: QRView(
//                       key: GlobalKey(),
//                       onQRViewCreated: (var controller) {
//                         _controller = controller;
//                       },
//                     ),
//                   ),
//                   Container(
//                     padding: EdgeInsets.all(16.0),
//                     child: Text(
//                       _qrCode ?? '',
//                       style: TextStyle(fontSize: 18.0),
//                     ),
//                   ),
//                 ],
//               ),
//             );
//           }
//         }

// class QRCodeStream {
//   QRCodeStream(Null Function(Barcode barcode) param0, {required format});
// }