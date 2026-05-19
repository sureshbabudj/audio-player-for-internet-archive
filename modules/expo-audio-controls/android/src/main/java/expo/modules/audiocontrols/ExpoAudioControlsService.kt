package expo.modules.audiocontrols

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.net.URL

class ExpoAudioControlsService : Service() {

  private val binder = LocalBinder()
  private var mediaSession: MediaSessionCompat? = null
  private val scope = CoroutineScope(Dispatchers.IO)
  private var artworkJob: Job? = null
  private var currentArtwork: Bitmap? = null

  // State
  private var title: String = ""
  private var artist: String = ""
  private var album: String = ""
  private var isPlaying: Boolean = false
  private var artworkUrl: String? = null

  var callback: ControlsCallback? = null

  interface ControlsCallback {
    fun onPlay()
    fun onPause()
    fun onNext()
    fun onPrevious()
    fun onSeekForward()
    fun onSeekBackward()
  }

  inner class LocalBinder : Binder() {
    fun getService(): ExpoAudioControlsService = this@ExpoAudioControlsService
  }

  override fun onBind(intent: Intent?): IBinder = binder

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()

    mediaSession = MediaSessionCompat(this, "ExpoAudioControlsSession").apply {
      setCallback(object : MediaSessionCompat.Callback() {
        override fun onPlay() { callback?.onPlay() }
        override fun onPause() { callback?.onPause() }
        override fun onSkipToNext() { callback?.onNext() }
        override fun onSkipToPrevious() { callback?.onPrevious() }
        override fun onFastForward() { callback?.onSeekForward() }
        override fun onRewind() { callback?.onSeekBackward() }
      })
      isActive = true
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    intent?.action?.let { action ->
      when (action) {
        "ACTION_PLAY" -> callback?.onPlay()
        "ACTION_PAUSE" -> callback?.onPause()
        "ACTION_NEXT" -> callback?.onNext()
        "ACTION_PREV" -> callback?.onPrevious()
      }
    }
    return START_NOT_STICKY
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        "expo_audio_controls",
        "Media Playback",
        NotificationManager.IMPORTANCE_LOW
      )
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
  }

  fun updateNowPlaying(metadata: Map<String, Any>) {
    val newTitle = metadata["title"] as? String ?: ""
    val newArtist = metadata["artist"] as? String ?: ""
    val newAlbum = metadata["album"] as? String ?: ""
    val newIsPlaying = metadata["isPlaying"] as? Boolean ?: false
    val newArtworkUrl = metadata["artworkUrl"] as? String

    title = newTitle
    artist = newArtist
    album = newAlbum
    isPlaying = newIsPlaying

    val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
    val position = (metadata["position"] as? Number)?.toLong() ?: 0L

    mediaSession?.setPlaybackState(
      PlaybackStateCompat.Builder()
        .setState(state, position, 1.0f)
        .setActions(
          PlaybackStateCompat.ACTION_PLAY or
          PlaybackStateCompat.ACTION_PAUSE or
          PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
          PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
          PlaybackStateCompat.ACTION_FAST_FORWARD or
          PlaybackStateCompat.ACTION_REWIND
        )
        .build()
    )

    mediaSession?.setMetadata(
      MediaMetadataCompat.Builder()
        .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
        .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
        .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album)
        .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, (metadata["duration"] as? Number)?.toLong() ?: 0L)
        .build()
    )

    if (newArtworkUrl != artworkUrl) {
      artworkUrl = newArtworkUrl
      currentArtwork = null
      if (newArtworkUrl != null && newArtworkUrl.isNotEmpty()) {
        artworkJob?.cancel()
        artworkJob = scope.launch {
          try {
            if (newArtworkUrl.startsWith("data:")) {
              val base64Data = newArtworkUrl.substringAfter("base64,")
              val decodedBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
              currentArtwork = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            } else {
              val url = URL(newArtworkUrl)
              currentArtwork = BitmapFactory.decodeStream(url.openConnection().getInputStream())
            }
            updateNotification()
          } catch (e: Exception) {
            updateNotification()
          }
        }
      } else {
        updateNotification()
      }
    } else {
      updateNotification()
    }
  }

  fun removeControls() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    stopSelf()
  }

  private fun updateNotification() {
    val notification = buildNotification()
    if (isPlaying) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(112233, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      } else {
        startForeground(112233, notification)
      }
    } else {
      // Pause: stop the foreground state to conserve battery, but keep the notification so they can resume
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        stopForeground(STOP_FOREGROUND_DETACH)
      } else {
        @Suppress("DEPRECATION")
        stopForeground(false)
      }
      // Since we stopped foreground, manually update the notification manager to show the paused state
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.notify(112233, notification)
    }
  }

  private fun getActionIntent(action: String): PendingIntent {
    val intent = Intent(this, ExpoAudioControlsService::class.java).setAction(action)
    return PendingIntent.getService(this, action.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun buildNotification(): Notification {
    val builder = NotificationCompat.Builder(this, "expo_audio_controls")
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setContentTitle(title.ifEmpty { "\u200E" })
      .setContentText(artist)
      .setSubText(album)
      .setLargeIcon(currentArtwork)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(isPlaying)

    val playPauseAction = if (isPlaying) {
      NotificationCompat.Action(android.R.drawable.ic_media_pause, "Pause", getActionIntent("ACTION_PAUSE"))
    } else {
      NotificationCompat.Action(android.R.drawable.ic_media_play, "Play", getActionIntent("ACTION_PLAY"))
    }

    builder.addAction(NotificationCompat.Action(android.R.drawable.ic_media_previous, "Previous", getActionIntent("ACTION_PREV")))
    builder.addAction(playPauseAction)
    builder.addAction(NotificationCompat.Action(android.R.drawable.ic_media_next, "Next", getActionIntent("ACTION_NEXT")))

    builder.setStyle(MediaStyle()
      .setMediaSession(mediaSession?.sessionToken)
      .setShowActionsInCompactView(0, 1, 2)
    )

    val appIntent = packageManager.getLaunchIntentForPackage(packageName)
    if (appIntent != null) {
      builder.setContentIntent(PendingIntent.getActivity(this, 0, appIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
    }

    return builder.build()
  }

  override fun onDestroy() {
    super.onDestroy()
    scope.cancel()
    mediaSession?.release()
    mediaSession = null
  }
}
