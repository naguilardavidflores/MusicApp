package com.nelson.musicapp;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "MusicScanner",
    permissions = {
        @Permission(
            alias = "audio",
            strings = {
                Manifest.permission.READ_EXTERNAL_STORAGE
            }
        )
    }
)
public class MusicScannerPlugin extends Plugin {

    @PluginMethod
    public void scanMusic(PluginCall call) {
        // For Android 13+ (API 33+), we check READ_MEDIA_AUDIO permission.
        // For older versions, we check READ_EXTERNAL_STORAGE.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            String readMediaAudio = "android.permission.READ_MEDIA_AUDIO";
            if (getActivity().checkSelfPermission(readMediaAudio) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                getActivity().requestPermissions(new String[]{readMediaAudio}, 12345);
                // Return immediate placeholder, or wait. For simplicity, request permission
                // and let performScan handle checking if permission was granted.
            }
        } else {
            if (getPermissionState("audio") != com.getcapacitor.PermissionState.GRANTED) {
                requestPermissionForAlias("audio", call, "audioPermissionCallback");
                return;
            }
        }
        performScan(call);
    }

    @PermissionCallback
    private void audioPermissionCallback(PluginCall call) {
        if (getPermissionState("audio") == com.getcapacitor.PermissionState.GRANTED) {
            performScan(call);
        } else {
            call.reject("Permission denied to read audio files");
        }
    }

    private void performScan(PluginCall call) {
        JSArray tracks = new JSArray();
        ContentResolver contentResolver = getContext().getContentResolver();
        
        Uri uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
        String selection = MediaStore.Audio.Media.IS_MUSIC + "!= 0";
        String sortOrder = MediaStore.Audio.Media.TITLE + " ASC";
        
        String[] projection = {
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.DATA
        };

        try (Cursor cursor = contentResolver.query(uri, projection, selection, null, sortOrder)) {
            if (cursor != null) {
                int idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                int titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                int artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                int albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                int durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                int dataCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);

                while (cursor.moveToNext()) {
                    long durationMs = cursor.getLong(durationCol);
                    double durationSec = durationMs / 1000.0;
                    
                    // RF-B01: Skip short audios (<15s)
                    if (durationSec < 15.0) {
                        continue;
                    }

                    String path = cursor.getString(dataCol);
                    String title = cursor.getString(titleCol);
                    String artist = cursor.getString(artistCol);
                    String album = cursor.getString(albumCol);
                    long id = cursor.getLong(idCol);

                    JSObject track = new JSObject();
                    track.put("id", "native-" + id);
                    track.put("title", title != null && !title.isEmpty() ? title : "Unknown Title");
                    track.put("artist", artist != null && !artist.equals("<unknown>") ? artist : "Unknown Artist");
                    track.put("album", album != null && !album.equals("<unknown>") ? album : "Unknown Album");
                    track.put("duration", durationSec);
                    track.put("filePath", path);
                    track.put("genre", "Unknown Genre");
                    
                    // Extract folder name
                    String folderName = "Root";
                    if (path != null) {
                        String[] parts = path.split("/");
                        if (parts.length > 1) {
                            folderName = parts[parts.length - 2];
                        }
                    }
                    track.put("parentFolder", folderName);

                    tracks.put(track);
                }
            }
            
            JSObject response = new JSObject();
            response.put("tracks", tracks);
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Error scanning music files: " + e.getMessage());
        }
    }
}
