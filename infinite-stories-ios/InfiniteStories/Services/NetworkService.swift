import Foundation
import os.log

final class NetworkService: NSObject {
    static let shared = NetworkService()
    
    private var backgroundSession: URLSession!
    private var backgroundCompletionHandler: (() -> Void)?
    private var activeTasks: [URLSessionTask: (Result<Data, Error>) -> Void] = [:]
    private let queue = DispatchQueue(label: "com.infinitestories.network", attributes: .concurrent)
    
    override private init() {
        super.init()
        setupBackgroundSession()
    }
    
    private func setupBackgroundSession() {
        let configuration = URLSessionConfiguration.background(withIdentifier: "com.infinitestories.background")
        configuration.isDiscretionary = false
        configuration.sessionSendsLaunchEvents = true
        configuration.shouldUseExtendedBackgroundIdleMode = true
        configuration.allowsCellularAccess = true
        configuration.timeoutIntervalForRequest = 300
        configuration.timeoutIntervalForResource = 300
        
        backgroundSession = URLSession(
            configuration: configuration,
            delegate: self,
            delegateQueue: nil
        )
        
        print("INFO: Background session configured")
    }
    
    func performBackgroundRequest(
        _ request: URLRequest,
        completion: @escaping (Result<Data, Error>) -> Void
    ) -> URLSessionDataTask {
        let task = backgroundSession.dataTask(with: request)
        
        queue.async(flags: .barrier) { [weak self] in
            self?.activeTasks[task] = completion
        }
        
        task.resume()
        print("INFO: Started background request: \(request.url?.absoluteString ?? "unknown")")
        
        return task
    }
    
    func performStandardRequest(
        _ request: URLRequest,
        completion: @escaping (Result<Data, Error>) -> Void
    ) -> URLSessionDataTask {
        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                print("ERROR: Request failed: \(error.localizedDescription)")
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                let error = NSError(
                    domain: "NetworkService",
                    code: -1,
                    userInfo: [NSLocalizedDescriptionKey: "No data received"]
                )
                print("ERROR: No data received")
                completion(.failure(error))
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse {
                print("INFO: Request completed with status: \(httpResponse.statusCode)")
            }
            
            completion(.success(data))
        }
        
        task.resume()
        print("INFO: Started standard request: \(request.url?.absoluteString ?? "unknown")")
        
        return task
    }
    
    func setBackgroundCompletionHandler(_ handler: @escaping () -> Void) {
        backgroundCompletionHandler = handler
        print("INFO: Background completion handler set")
    }
    
    private func callCompletionHandler(for task: URLSessionTask, with result: Result<Data, Error>) {
        queue.async(flags: .barrier) { [weak self] in
            if let completion = self?.activeTasks[task] {
                self?.activeTasks.removeValue(forKey: task)
                DispatchQueue.main.async {
                    completion(result)
                }
            }
        }
    }
}

extension NetworkService: URLSessionDelegate, URLSessionDataDelegate {
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        print("INFO: Received data: \(data.count) bytes")
        
        queue.sync {
            if activeTasks[dataTask] != nil {
                callCompletionHandler(for: dataTask, with: .success(data))
            }
        }
    }
    
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            print("ERROR: Task completed with error: \(error.localizedDescription)")
            callCompletionHandler(for: task, with: .failure(error))
        } else {
            print("INFO: Task completed successfully")
        }
    }
    
    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        print("INFO: Background session finished events")
        
        DispatchQueue.main.async { [weak self] in
            self?.backgroundCompletionHandler?()
            self?.backgroundCompletionHandler = nil
        }
    }
    
    func urlSession(_ session: URLSession, didBecomeInvalidWithError error: Error?) {
        if let error = error {
            print("ERROR: Session became invalid: \(error.localizedDescription)")
        }
        setupBackgroundSession()
    }
}