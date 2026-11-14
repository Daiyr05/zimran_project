package com.hangout.api.moment;

import com.hangout.api.common.ApiException;
import com.hangout.api.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * POST /uploads (FR-MOMENT-1, NFR-SEC-5): JPEG/PNG/WebP ≤ 5 MB, checked by magic bytes, not the client's MIME type.
 * JPEG and PNG are re-encoded, which drops EXIF (including GPS). Files are stored on local disk (a Docker volume)
 * and served at /uploads/{name}; swap this class for S3 later.
 */
@Service
public class UploadService {

    private static final Logger log = LoggerFactory.getLogger(UploadService.class);
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final Path dir;
    private final String publicUrl;

    public UploadService(AppProperties props) throws IOException {
        this.dir = Path.of(props.uploads().dir()).toAbsolutePath().normalize();
        this.publicUrl = props.publicUrl().replaceAll("/+$", "");
        Files.createDirectories(dir);
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.validation("file", "No file.");
        if (file.getSize() > MAX_BYTES) throw ApiException.validation("file", "Each photo must be 5 MB or less.");
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.validation("file", "Could not read the file.");
        }
        String ext = sniff(bytes);
        if (ext == null) throw ApiException.validation("file", "Use JPEG, PNG or WebP.");
        String name = UUID.randomUUID() + "." + ext;
        Path target = dir.resolve(name);
        try {
            if (ext.equals("webp")) {
                Files.write(target, bytes);
            } else {
                BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
                if (img == null) throw ApiException.validation("file", "That image can't be read.");
                BufferedImage out = img;
                if (ext.equals("jpg") && img.getType() != BufferedImage.TYPE_INT_RGB) {
                    out = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
                    out.getGraphics().drawImage(img, 0, 0, null);
                }
                if (!ImageIO.write(out, ext.equals("jpg") ? "jpeg" : "png", target.toFile())) {
                    throw ApiException.validation("file", "That image can't be saved.");
                }
            }
        } catch (IOException e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL", "Could not save the photo.");
        }
        return publicUrl + "/uploads/" + name;
    }

    /** Removes photo files this server stored (ignores external URLs). */
    public void deleteIfOwned(List<String> urls) {
        for (String url : urls) {
            if (url == null || !url.startsWith(publicUrl + "/uploads/")) continue;
            String name = url.substring((publicUrl + "/uploads/").length());
            if (name.contains("/") || name.contains("..")) continue;
            try {
                Files.deleteIfExists(dir.resolve(name));
            } catch (IOException e) {
                log.warn("Could not delete {}", name);
            }
        }
    }

    private static String sniff(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
        if (b.length >= 8 && Arrays.equals(Arrays.copyOf(b, 8), new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) return "png";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
        return null;
    }

    public Map<String, String> response(String url) {
        return Map.of("url", url);
    }
}
