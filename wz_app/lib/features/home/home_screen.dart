import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/auth_provider.dart';
import '../wz_documents/history_screen.dart';
import '../wz_documents/new_wz_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('WZ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton(
              key: const Key('new_wz_button'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NewWzScreen()),
              ),
              child: const Text('Nowy WZ'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('history_button'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const HistoryScreen()),
              ),
              child: const Text('Historia'),
            ),
          ],
        ),
      ),
    );
  }
}
