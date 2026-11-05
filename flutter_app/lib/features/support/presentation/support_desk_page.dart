import '../../../app/friendoo_ui.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../wallet/data/wallet_repository.dart';
import '../data/support_repository.dart';
import 'support_chat_sheet.dart';

class SupportDeskPage extends StatefulWidget {
  const SupportDeskPage({
    super.key,
    this.initialScenario = 'general',
    this.initialSubject,
    this.initialMetadata,
    this.isHost = false,
  });

  final String initialScenario;
  final String? initialSubject;
  final Map<String, dynamic>? initialMetadata;
  final bool isHost;

  static Future<bool?> show(
    BuildContext context, {
    String initialScenario = 'general',
    String? initialSubject,
    Map<String, dynamic>? initialMetadata,
    bool isHost = false,
  }) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => SupportDeskPage(
          initialScenario: initialScenario,
          initialSubject: initialSubject,
          initialMetadata: initialMetadata,
          isHost: isHost,
        ),
      ),
    );
  }

  @override
  State<SupportDeskPage> createState() => _SupportDeskPageState();
}

class _SupportDeskPageState extends State<SupportDeskPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final SupportRepository _supportRepo = SupportRepository();
  final WalletRepository _walletRepo = WalletRepository(Supabase.instance.client);

  late String _selectedScenario;
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _orderIdController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();

  bool _isSubmitting = false;
  List<SupportTicketItem> _myTickets = [];
  bool _isLoadingTickets = true;
  int _currentCoinBalance = 0;

  static const List<Map<String, dynamic>> _scenarios = [
    {
      'key': 'payment_failure',
      'title': 'Payment & Recharge Issue',
      'subtitle': 'Money debited, coins not credited, or UPI failure',
      'icon': Icons.payment_rounded,
      'color': Color(0xFFEF4444),
      'priority': 'urgent',
    },
    {
      'key': 'call_drop_billing',
      'title': 'Call Drop & Billing',
      'subtitle': 'Call disconnected abruptly or coins deducted falsely',
      'icon': Icons.phone_missed_rounded,
      'color': Color(0xFFF59E0B),
      'priority': 'high',
    },
    {
      'key': 'host_misconduct',
      'title': 'Host Report / Safety',
      'subtitle': 'Report abusive behavior, harassment, or policy violation',
      'icon': Icons.shield_rounded,
      'color': Color(0xFF8B5CF6),
      'priority': 'high',
    },
    {
      'key': 'wallet_mismatch',
      'title': 'Wallet & Balance Query',
      'subtitle': 'Discrepancy in coin balance or bonus rewards',
      'icon': Icons.account_balance_wallet_rounded,
      'color': Color(0xFF10B981),
      'priority': 'medium',
    },
    {
      'key': 'general_query',
      'title': 'General Help & Grievance',
      'subtitle': 'App feedback, profile questions, or technical help',
      'icon': Icons.support_agent_rounded,
      'color': Color(0xFF3B82F6),
      'priority': 'medium',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _selectedScenario = widget.initialScenario;
    if (widget.initialSubject != null) {
      _subjectController.text = widget.initialSubject!;
    }
    if (widget.initialMetadata != null) {
      if (widget.initialMetadata!['order_id'] != null) {
        _orderIdController.text = widget.initialMetadata!['order_id'].toString();
      }
      if (widget.initialMetadata!['amount_inr'] != null) {
        _amountController.text = widget.initialMetadata!['amount_inr'].toString();
      }
    }
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    try {
      final wallet = await _walletRepo.fetchCurrentWallet();
      if (mounted) setState(() => _currentCoinBalance = wallet.coinBalance);
    } catch (_) {}
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    setState(() => _isLoadingTickets = true);
    try {
      final tickets = await _supportRepo.fetchMyTickets();
      if (mounted) {
        setState(() {
          _myTickets = tickets;
          _isLoadingTickets = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingTickets = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    _orderIdController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _submitTicket() async {
    final subject = _subjectController.text.trim();
    final message = _messageController.text.trim();

    if (subject.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a brief subject.')),
      );
      return;
    }

    final scenarioConfig = _scenarios.firstWhere(
      (s) => s['key'] == _selectedScenario,
      orElse: () => _scenarios.last,
    );

    final metadata = <String, dynamic>{
      'submitted_via': 'mobile_app',
      'app_section': '24_7_support_desk',
      'is_host': widget.isHost,
      'reporter_wallet_coins': _currentCoinBalance,
      if (widget.initialMetadata != null) ...widget.initialMetadata!,
    };

    if (_selectedScenario == 'payment_failure') {
      if (_orderIdController.text.trim().isNotEmpty) {
        metadata['order_id'] = _orderIdController.text.trim();
      }
      if (_amountController.text.trim().isNotEmpty) {
        metadata['amount_inr'] = _amountController.text.trim();
      }
    }

    setState(() => _isSubmitting = true);

    try {
      final res = await _supportRepo.submitTicket(
        subject: subject,
        category: scenarioConfig['title'] as String,
        priority: scenarioConfig['priority'] as String,
        scenario: _selectedScenario,
        metadata: metadata,
        message: message,
      );

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      final ticketId = res['ticket_id']?.toString() ?? '';

      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: Color(0xFFE2E8F0))),
          title: Row(
            children: const [
              Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 24),
              SizedBox(width: 10),
              Text(
                'Ticket Submitted',
                style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ],
          ),
          content: Text(
            ticketId.isNotEmpty
                ? 'Your ticket (#${ticketId.substring(0, 8)}) has been registered with our 24/7 Operations Desk. A governance executive will resolve this promptly.'
                : 'Your ticket has been sent to our 24/7 Support Desk. We will assist you shortly.',
            style: const TextStyle(color: Color(0xFF475569), fontSize: 13.5, height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                _tabController.animateTo(1);
                _loadTickets();
              },
              child: const Text('View My Tickets', style: TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );

      _subjectController.clear();
      _messageController.clear();
      _orderIdController.clear();
      _amountController.clear();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit ticket: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 19),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '24/7 Support Desk',
              style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 18),
            ),
            Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                const Text(
                  'Live Executive Support Online',
                  style: TextStyle(color: Color(0xFF047857), fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF6366F1),
          indicatorWeight: 3,
          labelColor: const Color(0xFF0F172A),
          unselectedLabelColor: const Color(0xFF64748B),
          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
          tabs: const [
            Tab(text: 'Create Ticket'),
            Tab(text: 'My Reports & Tickets'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCreateTicketTab(),
          _buildMyTicketsTab(),
        ],
      ),
    );
  }

  Widget _buildCreateTicketTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 24/7 AI Chatbot Quick Action (Apple tactile response)
          ApplePressable(
            pressedScale: 0.96,
            onTap: () {
              SupportChatSheet.show(
                context,
                isHost: widget.isHost,
                onEscalateToTicket: (subject, message) {
                  setState(() {
                    _subjectController.text = subject;
                    _messageController.text = message;
                  });
                },
              );
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFECFDF5), Color(0xFFF0FDF4)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFA7F3D0)),
                boxShadow: const [
                  BoxShadow(color: Color(0x060E1020), blurRadius: 6, offset: Offset(0, 2)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.smart_toy_rounded, color: Color(0xFF047857), size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              '24/7 WhatsApp AI Support Bot',
                              style: TextStyle(color: Color(0xFF065F46), fontWeight: FontWeight.w800, fontSize: 13.5),
                            ),
                            SizedBox(width: 6),
                            Text(
                              '• LIVE',
                              style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.w800, fontSize: 10),
                            ),
                          ],
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Interactive menu for failed recharges, host payouts, coin rates & direct chat.',
                          style: TextStyle(color: Color(0xFF047857), fontSize: 11.5, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF047857), size: 20),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // 24/7 Priority SLA Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFEEF2FF), Color(0xFFF5F3FF)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFC7D2FE)),
              boxShadow: const [
                BoxShadow(color: Color(0x060E1020), blurRadius: 6, offset: Offset(0, 2)),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.flash_on_rounded, color: Color(0xFF4F46E5), size: 22),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Direct Governance Telemetry',
                        style: TextStyle(color: Color(0xFF312E81), fontWeight: FontWeight.w800, fontSize: 13.5),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Tickets automatically attach your transaction ID and account state so the Admin desk can refund or resolve immediately.',
                        style: TextStyle(color: Color(0xFF4338CA), fontSize: 11.5, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Select Incident Scenario
          const Text(
            'SELECT ISSUE CATEGORY',
            style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.8),
          ),
          const SizedBox(height: 10),

          ..._scenarios.map((sc) {
            final isSelected = _selectedScenario == sc['key'];
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFF8FAFC) : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected ? (sc['color'] as Color) : const Color(0xFFE2E8F0),
                  width: isSelected ? 1.6 : 1.0,
                ),
                boxShadow: const [
                  BoxShadow(color: Color(0x060E1020), blurRadius: 4, offset: Offset(0, 1)),
                ],
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: (sc['color'] as Color).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(sc['icon'] as IconData, color: sc['color'] as Color, size: 20),
                ),
                title: Text(
                  sc['title'] as String,
                  style: TextStyle(
                    color: const Color(0xFF0F172A),
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                  ),
                ),
                subtitle: Text(
                  sc['subtitle'] as String,
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                ),
                trailing: isSelected
                    ? Icon(Icons.check_circle_rounded, color: sc['color'] as Color, size: 20)
                    : const Icon(Icons.circle_outlined, color: Color(0xFFCBD5E1), size: 18),
                onTap: () {
                  setState(() {
                    _selectedScenario = sc['key'] as String;
                    if (_subjectController.text.isEmpty ||
                        _scenarios.any((s) => s['title'] == _subjectController.text)) {
                      _subjectController.text = sc['title'] as String;
                    }
                  });
                },
              ),
            );
          }),

          const SizedBox(height: 18),

          // Conditional Payment Failure inputs
          if (_selectedScenario == 'payment_failure') ...[
            Container(
              padding: const EdgeInsets.all(14),
              margin: const EdgeInsets.only(bottom: 18),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.receipt_long_rounded, color: Color(0xFFEF4444), size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Payment Details (Optional if known)',
                        style: TextStyle(color: Color(0xFF991B1B), fontWeight: FontWeight.bold, fontSize: 12.5),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _orderIdController,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 12.5, fontFamily: 'monospace', fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            labelText: 'Cashfree Order ID',
                            labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      SizedBox(
                        width: 110,
                        child: TextField(
                          controller: _amountController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Color(0xFF0F172A), fontSize: 12.5, fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            labelText: 'Amount (₹)',
                            labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],

          // Ticket Subject
          const Text(
            'ISSUE SUBJECT',
            style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.8),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _subjectController,
            cursorColor: const Color(0xFF6366F1),
            style: const TextStyle(color: Color(0xFF0F172A), fontSize: 14, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: 'Brief summary of the issue...',
              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),

          const SizedBox(height: 16),

          // Message details
          const Text(
            'DESCRIBE WHAT HAPPENED',
            style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.8),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _messageController,
            cursorColor: const Color(0xFF6366F1),
            maxLines: 4,
            style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13.5, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: 'Provide any additional context or transaction reference to expedite resolution...',
              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12.5),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
              ),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),

          const SizedBox(height: 24),

          // Submit CTA
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ApplePressable(
              pressedScale: 0.95,
              onTap: _isSubmitting ? null : _submitTicket,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitTicket,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 4,
              ),
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.send_rounded, size: 18, color: Colors.white),
                        SizedBox(width: 8),
                        Text(
                          'Submit Ticket to 24/7 Desk',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14.5),
                        ),
                      ],
                    ),
            ),
          ),
          ),
          const SizedBox(height: 18),
        ],
      ),
    );
  }

  Widget _buildMyTicketsTab() {
    if (_isLoadingTickets) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED)));
    }

    if (_myTickets.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
              child: const Icon(Icons.confirmation_number_outlined, size: 36, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            const Text(
              'No Support Tickets Yet',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 6),
            const Text(
              'Tickets you submit will be tracked here in real time.',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: const Color(0xFF7C3AED),
      onRefresh: _loadTickets,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _myTickets.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final ticket = _myTickets[index];
          final isResolved = ticket.status == 'resolved';
          final isOpen = ticket.status == 'open';

          Color statusColor;
          if (isResolved) {
            statusColor = const Color(0xFF10B981);
          } else if (isOpen) {
            statusColor = const Color(0xFFF59E0B);
          } else {
            statusColor = const Color(0xFF3B82F6);
          }

          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(color: Color(0x060E1020), blurRadius: 6, offset: Offset(0, 2)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: statusColor.withValues(alpha: 0.25)),
                      ),
                      child: Text(
                        ticket.status.toUpperCase(),
                        style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w900),
                      ),
                    ),
                    Text(
                      '#${ticket.id.substring(0, 8)}',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontFamily: 'monospace'),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  ticket.subject,
                  style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  ticket.category,
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                ),
                if (ticket.metadata['order_id'] != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Order: ${ticket.metadata['order_id']} • ₹${ticket.metadata['amount_inr'] ?? ''}',
                    style: const TextStyle(color: Color(0xFFF43F5E), fontSize: 11, fontFamily: 'monospace'),
                  ),
                ],
                const SizedBox(height: 10),
                Text(
                  ticket.createdAt.toLocal().toString().split('.')[0],
                  style: const TextStyle(color: Color(0xFF475569), fontSize: 10.5),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
