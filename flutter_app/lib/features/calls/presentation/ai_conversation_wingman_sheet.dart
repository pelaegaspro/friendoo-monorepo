import 'dart:convert';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/apple_pressable.dart';

class AiWingmanTip {
  const AiWingmanTip({
    required this.lead,
    required this.category,
  });

  final String lead;
  final String category;

  factory AiWingmanTip.fromJson(Map<String, dynamic> json) {
    return AiWingmanTip(
      lead: json['lead']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Conversation Lead',
    );
  }
}

class AiConversationWingmanSheet extends StatefulWidget {
  const AiConversationWingmanSheet({
    super.key,
    required this.partnerName,
    required this.isHost,
    required this.onTipSelected,
  });

  final String partnerName;
  final bool isHost;
  final void Function(String tip) onTipSelected;

  static Future<void> show(
    BuildContext context, {
    required String partnerName,
    required bool isHost,
    required void Function(String tip) onTipSelected,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AiConversationWingmanSheet(
        partnerName: partnerName,
        isHost: isHost,
        onTipSelected: onTipSelected,
      ),
    );
  }

  @override
  State<AiConversationWingmanSheet> createState() => _AiConversationWingmanSheetState();
}

class _AiConversationWingmanSheetState extends State<AiConversationWingmanSheet> {
  String _currentVibe = 'break_silence';
  bool _isLoadingAi = false;
  List<AiWingmanTip> _activeTips = [];

  final Map<String, String> _vibeLabels = {
    'break_silence': 'Break Silence',
    'playful': 'Playful & Fun',
    'compliment': 'Compliments',
    'deep': 'Deep Vibe',
  };

  @override
  void initState() {
    super.initState();
    _loadVibeTips(_currentVibe);
  }

  void _loadVibeTips(String vibe) {
    setState(() {
      _currentVibe = vibe;
      _activeTips = _getPresetTips(vibe, widget.partnerName);
    });
  }

  Future<void> _fetchFreshAiTips() async {
    setState(() => _isLoadingAi = true);
    HapticFeedback.lightImpact();

    final candidateEndpoints = [
      'https://friendoo-admin.netlify.app/api/calls/ai-wingman',
      'http://10.0.2.2:3000/api/calls/ai-wingman',
      'http://127.0.0.1:3000/api/calls/ai-wingman',
    ];

    bool fetched = false;

    for (final endpoint in candidateEndpoints) {
      try {
        final client = HttpClient()..connectionTimeout = const Duration(seconds: 4);
        final request = await client.postUrl(Uri.parse(endpoint));
        request.headers.set('content-type', 'application/json');
        request.add(utf8.encode(jsonEncode({
          'vibe': _currentVibe,
          'partnerName': widget.partnerName,
          'isHost': widget.isHost,
          'language': 'English / Hinglish',
        })));
        final response = await request.close();
        if (response.statusCode == 200) {
          final reply = await response.transform(utf8.decoder).join();
          final map = jsonDecode(reply) as Map<String, dynamic>;
          final rawList = map['tips'] as List<dynamic>?;
          if (rawList != null && rawList.isNotEmpty) {
            final fresh = rawList
                .map((t) => AiWingmanTip.fromJson(t as Map<String, dynamic>))
                .where((t) => t.lead.isNotEmpty)
                .toList();
            if (fresh.isNotEmpty) {
              setState(() {
                _activeTips = fresh;
                _isLoadingAi = false;
              });
              fetched = true;
              break;
            }
          }
        }
      } catch (_) {}
    }

    if (!fetched && mounted) {
      setState(() {
        _activeTips = _getPresetTips(_currentVibe, widget.partnerName);
        _isLoadingAi = false;
      });
    }
  }

  List<AiWingmanTip> _getPresetTips(String vibe, String name) {
    switch (vibe) {
      case 'break_silence':
        return [
          AiWingmanTip(
            category: 'Quick Topic 💡',
            lead: 'So $name, tell me one crazy or funny thing that happened to you this week!',
          ),
          AiWingmanTip(
            category: 'Personality ☕',
            lead: 'Quick question: Are you an energetic morning person or a quiet late-night thinker?',
          ),
          AiWingmanTip(
            category: 'Music 🎵',
            lead: 'What is your current go-to song that you have been listening to on repeat?',
          ),
        ];
      case 'playful':
        return [
          AiWingmanTip(
            category: 'Midnight Craving 🍕',
            lead: 'Be honest: What is your ultimate guilty pleasure midnight snack craving?',
          ),
          AiWingmanTip(
            category: 'Binge Watch 🎬',
            lead: 'Which movie or series can you re-watch 100 times without ever getting bored?',
          ),
          AiWingmanTip(
            category: 'Superpower 🚀',
            lead: 'If you had one superpower for 24 hours, what would you do first?',
          ),
        ];
      case 'compliment':
        return [
          AiWingmanTip(
            category: 'Sweet Voice 🎙️',
            lead: 'You know, you have such a calming voice to listen to after a long day.',
          ),
          AiWingmanTip(
            category: 'Positive Energy ✨',
            lead: 'I really love how easy it is to talk to you—great energy!',
          ),
          AiWingmanTip(
            category: 'Listener 👂',
            lead: 'You seem like someone who gives really genuine advice to people.',
          ),
        ];
      case 'deep':
        return [
          AiWingmanTip(
            category: 'Dreams ✈️',
            lead: 'If you could pack your bags and fly anywhere tomorrow morning, where would you go?',
          ),
          AiWingmanTip(
            category: 'Bucket List 🌟',
            lead: 'What is one dream or hobby that is at the very top of your bucket list?',
          ),
          AiWingmanTip(
            category: 'Gratitude 💖',
            lead: 'What is something small that made you genuinely happy recently?',
          ),
        ];
      default:
        return [
          AiWingmanTip(
            category: 'Casual 💬',
            lead: 'How has your day been so far? Anything exciting happen?',
          ),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0F131D).withValues(alpha: 0.94),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.12),
              width: 0.85,
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Apple Pull Bar Indicator
              Center(
                child: Container(
                  width: 38,
                  height: 4.5,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.22),
                    borderRadius: BorderRadius.circular(2.5),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Title Header Row (Refined Apple System Aesthetic)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.12),
                            width: 0.75,
                          ),
                        ),
                        child: const Icon(
                          Icons.tips_and_updates_outlined,
                          color: Color(0xFFF59E0B),
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Conversation Copilot',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            'Smart prompts to keep conversations natural & engaging',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.50),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  // Refresh Button (Apple Glass Capsule)
                  ApplePressable(
                    onTap: _isLoadingAi ? null : _fetchFreshAiTips,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.15),
                          width: 0.85,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _isLoadingAi
                              ? const SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.refresh_rounded, color: Colors.white, size: 14),
                          const SizedBox(width: 5),
                          const Text(
                            'Refresh',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // Vibe Selector Tabs (Apple Segmented Glass Pills)
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: _vibeLabels.entries.map((entry) {
                    final isSelected = _currentVibe == entry.key;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ApplePressable(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          _loadVibeTips(entry.key);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Colors.white.withValues(alpha: 0.16)
                                : Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: isSelected
                                  ? Colors.white.withValues(alpha: 0.35)
                                  : Colors.white.withValues(alpha: 0.08),
                              width: 0.85,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              entry.value,
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                letterSpacing: -0.1,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 16),

              // Active Prompts List (Apple Frosted Glass Tiles)
              Column(
                children: _activeTips.map((tip) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: ApplePressable(
                      scale: 0.98,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).pop();
                        widget.onTipSelected(tip.lead);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.04),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.09),
                            width: 0.85,
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                tip.category,
                                style: const TextStyle(
                                  color: Color(0xFFCBD5E1),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                '"${tip.lead}"',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w500,
                                  height: 1.35,
                                  letterSpacing: -0.15,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Padding(
                              padding: EdgeInsets.only(top: 2),
                              child: Icon(
                                Icons.chevron_right_rounded,
                                color: Color(0xFF94A3B8),
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 6),
              Center(
                child: Text(
                  'Tap any prompt to display as a private HUD prompter on your call screen',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.38),
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


