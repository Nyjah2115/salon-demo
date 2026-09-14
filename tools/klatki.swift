import AVFoundation
import AppKit

let args = CommandLine.arguments
let src = URL(fileURLWithPath: args[1])
let outPrefix = args[2]
let times: [Double] = args[3...].map { Double($0)! }
let asset = AVURLAsset(url: src)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
for t in times {
    let cm = CMTime(seconds: t, preferredTimescale: 600)
    if let cg = try? gen.copyCGImage(at: cm, actualTime: nil) {
        let rep = NSBitmapImageRep(cgImage: cg)
        if let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8]) {
            try? data.write(to: URL(fileURLWithPath: "\(outPrefix)-\(t).jpg"))
            print("ok \(t)")
        }
    } else { print("fail \(t)") }
}
