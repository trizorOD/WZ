import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Logowanie')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              key: const Key('email_field'),
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'E-mail'),
            ),
            TextField(
              key: const Key('password_field'),
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Haslo'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('login_button'),
              onPressed: () => ref
                  .read(authControllerProvider.notifier)
                  .login(_emailController.text, _passwordController.text),
              child: const Text('Zaloguj'),
            ),
            if (authState.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(authState.error!, style: const TextStyle(color: Colors.red)),
              ),
          ],
        ),
      ),
    );
  }
}
