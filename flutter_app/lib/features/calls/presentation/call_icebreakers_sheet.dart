import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/apple_pressable.dart';

class IcebreakerTopic {
  const IcebreakerTopic({
    required this.category,
    required this.emoji,
    required this.questions,
  });

  final String category;
  final String emoji;
  final List<String> questions;
}

const List<IcebreakerTopic> kIcebreakerTopics = [
  IcebreakerTopic(
    category: 'Vibes & Moods',
    emoji: '✨',
    questions: [
      'What song always lifts your mood instantly when you feel down?',
      'Are you a quiet night coffee person or an energetic daytime person?',
      'What is one small thing that made you smile today?',
    ],
  ),
  IcebreakerTopic(
    category: 'Food & Late Nights',
    emoji: '🍕',
    questions: [
      'What is your ultimate comfort midnight snack or street food craving?',
      'Chai or Coffee? And where is the best place you have had it?',
      'If you could only eat one dish for the rest of your life, what would it be?',
    ],
  ),
  IcebreakerTopic(
    category: 'Cinema & Binging',
    emoji: '🎬',
    questions: [
      'Which movie or series can you re-watch 10 times without getting bored?',
      'Arijit Singh soul vibes, or high-energy Anirudh/AR Rahman beats?',
      'Who is your all-time favorite celebrity or actor you admire?',
    ],
  ),
  IcebreakerTopic(
    category: 'Fun & Secrets',
    emoji: '😂',
    questions: [
      'What is the funniest or most embarrassing thing that happened to you in college or school?',
      'What is a weird hidden talent or habit that nobody knows about you?',
      'If you won ₹10 Lakhs in a lottery tomorrow, what is the very first thing you would buy?',
    ],
  ),
  IcebreakerTopic(
    category: 'Travel & Dreams',
    emoji: '✈️',
    questions: [
      'If you could pack your bags and fly anywhere tomorrow morning, where would you go?',
      'Peaceful mountain hill-station or sunset beach vibes with cool breeze?',
      'What is one dream destination that is at the top of your bucket list?',
    ],
  ),
];

class CallIcebreakersSheet extends StatefulWidget {
  const CallIcebreakersSheet({
    super.key,
    required this.onTopicSelected,
  });

  final void Function(String question) onTopicSelected;

  static Future<void> show(
    BuildContext context, {
    required void Function(String question) onTopicSelected,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CallIcebreakersSheet(onTopicSelected: onTopicSelected),
    );
  }

  @override
  State<CallIcebreakersSheet> createState() => _CallIcebreakersSheetState();
}

class _CallIcebreakersSheetState extends State<CallIcebreakersSheet> {
  int _selectedCategoryIndex = 0;

  @override
  Widget build(BuildContext context) {
    final activeTopic = kIcebreakerTopics[_selectedCategoryIndex];

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

              // Title Row
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
                      Icons.forum_outlined,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Icebreaker Starters',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                        ),
                      ),
                      SizedBox(height: 1),
                      Text(
                        'Questions to start a conversation',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Category Tabs (Apple Segmented Glass Pills)
              SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: kIcebreakerTopics.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final item = kIcebreakerTopics[index];
                    final isSelected = _selectedCategoryIndex == index;

                    return ApplePressable(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _selectedCategoryIndex = index);
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
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(item.emoji, style: const TextStyle(fontSize: 13)),
                            const SizedBox(width: 6),
                            Text(
                              item.category,
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                letterSpacing: -0.1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 16),

              // Questions List (Apple Frosted Glass Tiles)
              Column(
                children: activeTopic.questions.map((q) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: ApplePressable(
                      scale: 0.98,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).pop();
                        widget.onTopicSelected(q);
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
                          children: [
                            Expanded(
                              child: Text(
                                q,
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
                            const Icon(
                              Icons.chevron_right_rounded,
                              color: Color(0xFF94A3B8),
                              size: 18,
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
                  'Tap any topic to display as a private prompter on your call screen',
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

