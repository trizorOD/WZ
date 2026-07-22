class Client {
  const Client({required this.id, required this.nip, required this.name, required this.address});

  final int id;
  final String nip;
  final String name;
  final String address;

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        id: json['id'] as int,
        nip: json['nip'] as String,
        name: json['name'] as String,
        address: json['address'] as String,
      );

  @override
  bool operator ==(Object other) =>
      other is Client && other.id == id && other.nip == nip && other.name == name && other.address == address;

  @override
  int get hashCode => Object.hash(id, nip, name, address);
}
