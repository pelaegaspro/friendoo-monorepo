package com.friendoo.app.presentation.call

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.delay

@Composable
fun WaitingScreen(
    requestId: String,
    onMatched: (String, String, String) -> Unit, // callId, hostAlias, hostColor
    onTimeout: () -> Unit,
    onCancel: () -> Unit
) {
    val db = FirebaseFirestore.getInstance()
    var timeLeft by remember { mutableStateOf(30) }
    var listener: ListenerRegistration? by remember { mutableStateOf(null) }

    val infiniteTransition = rememberInfiniteTransition()
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    LaunchedEffect(requestId) {
        // 1. Listen for Request Status
        listener = db.collection("callRequests").document(requestId)
            .addSnapshotListener { snapshot, _ ->
                val status = snapshot?.getString("status")
                if (status == "accepted") {
                    val hostId = snapshot.getString("acceptedByHostId")
                    if (hostId != null) {
                        // Find the call session created by Cloud Function
                        db.collection("calls")
                            .whereEqualTo("fromUserId", FirebaseAuth.getInstance().currentUser?.uid)
                            .whereEqualTo("hostId", hostId)
                            .whereEqualTo("status", "active")
                            .limit(1)
                            .get()
                            .addOnSuccessListener { callSnap ->
                                if (!callSnap.isEmpty) {
                                    val callDoc = callSnap.documents[0]
                                    onMatched(
                                        callDoc.id,
                                        callDoc.getString("hostAlias") ?: "Host",
                                        "#3700B3"
                                    )
                                }
                            }
                    }
                } else if (status == "expired") {
                    onTimeout()
                }
            }

        // 2. Countdown Timer
        while (timeLeft > 0) {
            delay(1000)
            timeLeft--
        }
        onTimeout()
    }

    DisposableEffect(Unit) {
        onDispose { listener?.remove() }
    }

    Box(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(contentAlignment = Alignment.Center) {
                // Pulse Animation
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .scale(pulseScale)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f), CircleShape)
                )
                
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(80.dp)
                ) {
                    Icon(
                        Icons.Default.Search,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.padding(20.dp).size(40.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                "Finding someone for you...",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black
            )
            
            Text(
                "Connecting you to the first available host",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                modifier = Modifier.padding(top = 8.dp)
            )

            Spacer(modifier = Modifier.height(48.dp))

            Text(
                "$timeLeft seconds remaining",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.secondary,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(64.dp))

            TextButton(onClick = onCancel) {
                Text("Cancel Request", color = Color.Gray)
            }
        }
    }
}

@Composable
fun TimeoutScreen(onRetry: () -> Unit, onBrowse: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            "No hosts available right now",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Text(
            "Our hosts are currently busy. Try again or check back in a few minutes.",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(vertical = 16.dp)
        )
        
        Button(
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Try Again", fontWeight = FontWeight.Bold)
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedButton(
            onClick = onBrowse,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Browse Hosts", fontWeight = FontWeight.Bold)
        }
    }
}
