class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'WZ_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );
}
