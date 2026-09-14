import AVFoundation
import CoreMedia

// Przekodowanie klipu na niższy bitrate — wersja na telefon.
// macOS nie ma ffmpeg, a avconvert nie pozwala ustawić bitrate'u.
// Użycie: lekkie <wejscie> <wyjscie> <kilobity>

let args = CommandLine.arguments
let src = URL(fileURLWithPath: args[1])
let dst = URL(fileURLWithPath: args[2])
let kbit = Int(args[3])! * 1000
try? FileManager.default.removeItem(at: dst)

let asset = AVURLAsset(url: src)
guard let track = asset.tracks(withMediaType: .video).first else { exit(1) }

let reader = try AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
])
reader.add(output)
reader.startReading()

let w = Int(track.naturalSize.width), h = Int(track.naturalSize.height)
let writer = try AVAssetWriter(outputURL: dst, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: w,
    AVVideoHeightKey: h,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: kbit,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
    ]
])
input.expectsMediaDataInRealTime = false
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let sem = DispatchSemaphore(value: 0)
input.requestMediaDataWhenReady(on: DispatchQueue(label: "zapis")) {
    while input.isReadyForMoreMediaData {
        if let sample = output.copyNextSampleBuffer() {
            input.append(sample)
        } else {
            input.markAsFinished()
            writer.finishWriting { sem.signal() }
            return
        }
    }
}
sem.wait()
print("zapisane \(w)x\(h) @ \(kbit/1000) kb/s → \(dst.lastPathComponent)")
