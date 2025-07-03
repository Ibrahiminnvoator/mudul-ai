import {
    processImageAction,
    getProcessingStatusAction
  } from "@/actions/image-processing-actions"
  import { inngest } from "@/lib/inngest-client"
  
  /**
   * @description
   * Unit tests for the image processing server actions.
   * These tests mock the Inngest client to verify the actions' logic without
   * making real calls to the Inngest service.
   *
   * @dependencies
   * - @/actions/image-processing-actions: The actions being tested.
   * - @/lib/inngest-client: The Inngest client, which is mocked.
   */
  
  // Mock the Inngest client module
  jest.mock("@/lib/inngest-client", () => ({
    inngest: {
      send: jest.fn(),
      jobs: {
        get: jest.fn()
      }
    }
  }))
  
  // A helper to cast the mocked Inngest client to a type that Jest can use
  const mockedInngest = inngest as jest.Mocked<typeof inngest>
  
  describe("Image Processing Server Actions", () => {
    // Clear mock history before each test
    beforeEach(() => {
      jest.clearAllMocks()
    })
  
    // Tests for processImageAction
    describe("processImageAction", () => {
      it("should successfully dispatch a job to Inngest", async () => {
        // Arrange: Mock the Inngest `send` function to return a job ID
        mockedInngest.send.mockResolvedValueOnce({ ids: ["job-123"] })
        const request = {
          imageData: "base64data",
          mimeType: "image/png",
          prompt: "make it amazing"
        }
  
        // Act: Call the action
        const result = await processImageAction(request)
  
        // Assert: Check if the action was successful and Inngest was called correctly
        expect(result.isSuccess).toBe(true)
        if (result.isSuccess) {
          expect(result.data.jobId).toBe("job-123")
        }
        expect(mockedInngest.send).toHaveBeenCalledWith({
          name: "image.process",
          data: request
        })
      })
  
      it("should return an error if request data is incomplete", async () => {
        const request = {
          imageData: "base64data",
          mimeType: "image/png",
          prompt: "" // Missing prompt
        }
  
        const result = await processImageAction(request)
  
        expect(result.isSuccess).toBe(false)
        expect(result.message).toBe("بيانات الطلب غير كاملة.")
        expect(mockedInngest.send).not.toHaveBeenCalled()
      })
    })
  
    // Tests for getProcessingStatusAction
    describe("getProcessingStatusAction", () => {
      it("should return COMPLETED status for a completed job", async () => {
        const mockJob = {
          id: "job-123",
          status: "completed",
          output: {
            body: { imageData: "processedBase64", mimeType: "image/png" }
          }
        }
        mockedInngest.jobs.get.mockResolvedValueOnce(mockJob as any)
  
        const result = await getProcessingStatusAction("job-123")
  
        expect(result.isSuccess).toBe(true)
        if (result.isSuccess) {
          expect(result.data.status).toBe("COMPLETED")
          expect(result.data.result).toEqual(mockJob.output.body)
        }
        expect(mockedInngest.jobs.get).toHaveBeenCalledWith("job-123")
      })
  
      it("should return PROCESSING status for a running job", async () => {
        const mockJob = { id: "job-123", status: "running" }
        mockedInngest.jobs.get.mockResolvedValueOnce(mockJob as any)
  
        const result = await getProcessingStatusAction("job-123")
  
        expect(result.isSuccess).toBe(true)
        if (result.isSuccess) {
          expect(result.data.status).toBe("PROCESSING")
        }
      })
  
      it("should return FAILED status for a failed job", async () => {
        const mockJob = {
          id: "job-123",
          status: "failed",
          data: { event: { data: { error: { message: "API error" } } } }
        }
        mockedInngest.jobs.get.mockResolvedValueOnce(mockJob as any)
  
        const result = await getProcessingStatusAction("job-123")
  
        expect(result.isSuccess).toBe(true)
        if (result.isSuccess) {
          expect(result.data.status).toBe("FAILED")
          expect(result.data.error).toBe("API error")
        }
      })
  
      it("should return an error if the job is not found", async () => {
        mockedInngest.jobs.get.mockResolvedValueOnce(null)
  
        const result = await getProcessingStatusAction("job-404")
  
        expect(result.isSuccess).toBe(false)
        expect(result.message).toBe("لم يتم العثور على المهمة.")
      })
    })
  })