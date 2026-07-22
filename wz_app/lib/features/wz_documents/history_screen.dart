import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'pdf_result_screen.dart';
import 'wz_document_model.dart';
import 'wz_documents_repository.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  List<WzDocumentSummary> _documents = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load([String query = '']) async {
    final documents = await ref.read(wzDocumentsRepositoryProvider).list(client: query);
    setState(() => _documents = documents);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Historia WZ')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              key: const Key('history_search_field'),
              decoration: const InputDecoration(labelText: 'Szukaj po kliencie'),
              onChanged: _load,
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _documents.length,
              itemBuilder: (context, index) {
                final document = _documents[index];
                return ListTile(
                  key: Key('history_tile_${document.id}'),
                  title: Text(document.number),
                  subtitle: Text('${document.clientName} - ${document.dispatchDate}'),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => PdfResultScreen(documentId: document.id, number: document.number),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
