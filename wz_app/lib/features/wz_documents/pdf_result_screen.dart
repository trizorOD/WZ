import 'package:flutter/material.dart';

class PdfResultScreen extends StatelessWidget {
  const PdfResultScreen({super.key, required this.documentId, required this.number});

  final int documentId;
  final String number;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('WZ $number')),
      body: const Center(child: Text('PDF preview coming in Task 8')),
    );
  }
}
