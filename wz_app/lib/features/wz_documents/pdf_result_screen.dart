import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';
import 'wz_documents_repository.dart';

class PdfResultScreen extends ConsumerStatefulWidget {
  const PdfResultScreen({super.key, required this.documentId, required this.number});

  final int documentId;
  final String number;

  @override
  ConsumerState<PdfResultScreen> createState() => _PdfResultScreenState();
}

class _PdfResultScreenState extends ConsumerState<PdfResultScreen> {
  late final Future<List<int>> _pdfBytesFuture;

  @override
  void initState() {
    super.initState();
    _pdfBytesFuture = ref.read(wzDocumentsRepositoryProvider).fetchPdfBytes(widget.documentId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('WZ ${widget.number}')),
      body: FutureBuilder<List<int>>(
        future: _pdfBytesFuture,
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
