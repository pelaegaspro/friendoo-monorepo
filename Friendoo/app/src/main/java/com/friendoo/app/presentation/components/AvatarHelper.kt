package com.friendoo.app.presentation.components

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.ImageLoader
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.friendoo.app.presentation.theme.Primary

object AvatarSize {
    val XS = 32.dp
    val SM = 48.dp
    val MD = 64.dp
    val LG = 96.dp
    val XL = 120.dp
}

/**
 * Canonical avatar URL builder. All platforms must use this exact formula.
 * Style is hardcoded to "open-peeps" — no user-selectable styles.
 */
fun getAvatarUrl(seed: String, size: Int = 128): String {
    val encodedSeed = java.net.URLEncoder.encode(seed, "UTF-8")
    return "https://api.dicebear.com/9.x/open-peeps/png?seed=$encodedSeed&size=$size"
}

/**
 * Simple DiceBear avatar with seed parameter.
 */
@Composable
fun DiceBearAvatar(
    seed: String,
    size: Dp = 48.dp,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val url = getAvatarUrl(seed, (size.value * 2).toInt())

    AsyncImage(
        model = ImageRequest.Builder(context)
            .data(url)
            .crossfade(true)
            .build(),
        contentDescription = "Avatar",
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .border(2.dp, Primary, CircleShape)
    )
}

/**
 * Primary avatar composable for all surfaces.
 * Uses avatarSeed as the sole source of truth for DiceBear generation.
 * If avatarSeed is empty, shows a neutral placeholder circle.
 */
data class AvatarConfig(
    val top: String = "",
    val topColor: String = "",
    val skinColor: String = "",
    val eyes: String = "",
    val clothing: String = "",
    val clothingColor: String = "",
    val accessories: String = "",
    val facialHair: String = ""
) {
    fun toMap(): Map<String, String> {
        return mapOf(
            "top" to top,
            "topColor" to topColor,
            "skinColor" to skinColor,
            "eyes" to eyes,
            "clothing" to clothing,
            "clothingColor" to clothingColor,
            "accessories" to accessories,
            "facialHair" to facialHair
        ).filterValues { it.isNotEmpty() }
    }

    fun buildUrl(seed: String, size: Int = 256): String {
        val encodedSeed = java.net.URLEncoder.encode(seed, "UTF-8")
        val builder = StringBuilder("https://api.dicebear.com/9.x/avataaars/png?seed=$encodedSeed&size=$size")
        if (top.isNotEmpty()) builder.append("&top=$top")
        if (topColor.isNotEmpty()) builder.append("&topColor=$topColor")
        if (skinColor.isNotEmpty()) builder.append("&skinColor=$skinColor")
        if (eyes.isNotEmpty()) builder.append("&eyes=$eyes")
        if (clothing.isNotEmpty()) builder.append("&clothing=$clothing")
        if (clothingColor.isNotEmpty()) builder.append("&clothingColor=$clothingColor")
        if (accessories.isNotEmpty()) builder.append("&accessories=$accessories")
        if (facialHair.isNotEmpty()) builder.append("&facialHair=$facialHair")
        return builder.toString()
    }

    companion object {
        val maleTops = listOf("shortCurly", "shortFlat", "shortRound", "shortWaved", "sides", "theCaesar", "theCaesarAndSidePart", "shavedSides", "frizzle", "dreads01", "dreads02")
        val femaleTops = listOf("bigHair", "bob", "bun", "curly", "curvy", "dreads", "frida", "fro", "froAndBand", "longButNotTooLong", "miaWallace", "straight01", "straight02", "straightAndStrand")
        val topColors = listOf("2c1b18", "4a3728", "724124", "b58143", "e8c16d", "a55728", "c53030", "45413c", "2b2b2b")
        val skinColors = listOf("ffdbb4", "f8d25c", "edb98a", "fd9841", "d08b5b", "ae5d29", "614335")
        val eyesList = listOf("default", "happy", "wink", "surprised", "close", "squint")
        val clothings = listOf("hoodie", "blazerShirt", "blazerSweater", "collarSweater", "graphicShirt", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck")
        val clothingColors = listOf("2c3e50", "65c3ba", "262e33", "e6e6e6", "e1c0c0", "f5af6b", "f8b2d1", "f9da8f", "3c3c3c", "ffffff")
        val accessoriesList = listOf("blank", "prescription01", "prescription02", "round", "wayfarers")
        val facialHairs = listOf("blank", "beardMedium", "beardLight", "moustacheFancy")

        fun fromMap(map: Map<String, String>?): AvatarConfig {
            if (map == null) return AvatarConfig()
            return AvatarConfig(
                top = map["top"] ?: "",
                topColor = map["topColor"] ?: "",
                skinColor = map["skinColor"] ?: "",
                eyes = map["eyes"] ?: "",
                clothing = map["clothing"] ?: "",
                clothingColor = map["clothingColor"] ?: "",
                accessories = map["accessories"] ?: "",
                facialHair = map["facialHair"] ?: ""
            )
        }

        fun generateRandom(isHost: Boolean): AvatarConfig {
            return AvatarConfig(
                top = (if (isHost) femaleTops else maleTops).random(),
                topColor = topColors.random(),
                skinColor = skinColors.random(),
                eyes = eyesList.random(),
                clothing = clothings.random(),
                clothingColor = clothingColors.random(),
                accessories = if (java.util.Random().nextBoolean()) "blank" else accessoriesList.random(),
                facialHair = if (isHost) "blank" else (if (java.util.Random().nextInt(4) == 0) facialHairs.random() else "blank")
            )
        }
    }
}

/**
 * Primary avatar composable for all surfaces.
 * Uses avatarSeed or dynamic avatarUrl to render the customize graphic.
 */
@Composable
fun FriendooAvatar(
    avatarSeed: String,
    size: Dp = 48.dp,
    modifier: Modifier = Modifier,
    avatarUrl: String = ""
) {
    val context = LocalContext.current

    if (avatarSeed.isBlank() && avatarUrl.isBlank()) {
        // Neutral placeholder when seed is missing (during migration)
        Box(
            modifier = modifier
                .size(size)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .border(2.dp, Primary, CircleShape)
        )
        return
    }

    val url = if (avatarUrl.isNotBlank()) {
        avatarUrl
    } else if (avatarSeed.startsWith("http")) {
        avatarSeed
    } else {
        getAvatarUrl(avatarSeed, (size.value * 2).toInt())
    }

    AsyncImage(
        model = ImageRequest.Builder(context)
            .data(url)
            .crossfade(true)
            .build(),
        contentDescription = "Avatar",
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .border(2.dp, Primary, CircleShape)
    )
}

suspend fun getAvatarBitmap(context: Context, url: String): Bitmap? {
    val loader = ImageLoader(context)
    val request = ImageRequest.Builder(context)
        .data(url)
        .allowHardware(false)
        .build()

    val result = loader.execute(request)
    return (result.drawable as? BitmapDrawable)?.bitmap
}
