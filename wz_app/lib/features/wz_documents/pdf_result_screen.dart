import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';
import 'wz_documents_repository.dart';

class PdfResultScreen extends ConsumerWidget {
  const PdfResultScreen({super.key, required this.documentId, required this.number});

  final int documentId;
  final String number;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repository = ref.watch(wzDocumentsRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: Text('WZ $number')),
      body: FutureBuilder<List<int>>(
        future: repository.fetchPdfBytes(documentId),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final bytes = Uint8List.fromList(snapshot.data!);
          return PdfPreview(
            build: (format) async => bytes,
            canDebug: false,
            allowSharing: true,
            allowPrinting: true,
          );
        },
      ),
    );
  }
}
