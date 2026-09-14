import AVFoundation
import CoreMedia

// Robi z klipu wersję "tam i z powrotem": klatki do przodu, potem w odwrotnej
// kolejności. Dzięki temu pętla nie ma szwu — obraz wraca dokładnie tam,
// skąd wyszedł. macOS nie ma ffmpeg, więc AVFoundation.

let args = CommandLine.arguments
let src = URL(fileURLWithPath: args[1])
let dst = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: dst)

let asset = AVURLAsset(url: src)
guard let track = asset.tracks(withMediaType: .video).first else { exit(1) }

let reader = try AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
])
output.alwaysCopiesSampleData = false
reader.add(output)
reader.startReading()

var klatki: [CVPixelBuffer] = []
while let sample = output.copyNextSampleBuffer() {
    if let pb = CMSampleBufferGetImageBuffer(sample) { klatki.append(pb) }
}
print("wczytane klatki: \(klatki.count)")
guard klatki.count > 2 else { exit(1) }

let w = CVPixelBufferGetWidth(klatki[0])
let h = CVPixelBufferGetHeight(klatki[0])
let fps = track.nominalFrameRate > 0 ? track.nominalFrameRate : 24

let writer = try AVAssetWriter(outputURL: dst, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: w,
    AVVideoHeightKey: h,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 2_300_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
    ]
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: nil)
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

// do przodu, a potem od tyłu bez powtarzania skrajnych klatek
var kolejka = klatki
kolejka.append(contentsOf: klatki.dropFirst().dropLast().reversed())

let skala: Int32 = 600
let krok = Int64(Double(skala) / Double(fps))
var i = 0
let kolejka2 = kolejka

let sem = DispatchSemaphore(value: 0)
input.requestMediaDataWhenReady(on: DispatchQueue(label: "zapis")) {
    while input.isReadyForMoreMediaData {
        if i >= kolejka2.count {
            input.markAsFinished()
            writer.finishWriting { sem.signal() }
            return
        }
        let czas = CMTime(value: Int64(i) * krok, timescale: skala)
        adaptor.append(kolejka2[i], withPresentationTime: czas)
        i += 1
    }
}
sem.wait()
print("zapisane klatki: \(kolejka2.count), \(w)x\(h) @ \(fps) fps → \(dst.path)")
