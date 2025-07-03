import { validateFileAction } from "@/actions/file-validation-actions"

/**
 * @description
 * Unit tests for the `validateFileAction` server action.
 * These tests verify that the server-side file validation logic correctly
 * handles valid files, oversized files, invalid file types, and missing files.
 *
 * @dependencies
 * - @/actions/file-validation-actions: The server action being tested.
 *
 * @notes
 * - We use mock `File` and `FormData` objects to simulate file uploads without
 *   a real browser environment.
 * - The test environment is configured via `jest.config.js`.
 */
describe("File Validation Server Action", () => {
  // Test case 1: A valid file should pass validation.
  it("should return success for a valid file", async () => {
    const validFile = new File(["valid"], "test.png", { type: "image/png" })
    const formData = new FormData()
    formData.append("file", validFile)

    const result = await validateFileAction(formData)

    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.data.fileName).toBe("test.png")
      expect(result.data.fileType).toBe("image/png")
      expect(result.data.isValid).toBe(true)
    }
  })

  // Test case 2: A file exceeding the size limit should be rejected.
  it("should return an error for a file that is too large", async () => {
    // Create a file larger than 7MB (7 * 1024 * 1024 bytes)
    const largeFile = new File(["a".repeat(8 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg"
    })
    const formData = new FormData()
    formData.append("file", largeFile)

    const result = await validateFileAction(formData)

    expect(result.isSuccess).toBe(false)
    if (!result.isSuccess) {
      expect(result.message).toContain("حجم الملف يتجاوز 7 ميجابايت المسموح")
    }
  })

  // Test case 3: A file with an unsupported MIME type should be rejected.
  it("should return an error for an invalid file type", async () => {
    const invalidFile = new File(["invalid"], "test.gif", { type: "image/gif" })
    const formData = new FormData()
    formData.append("file", invalidFile)

    const result = await validateFileAction(formData)

    expect(result.isSuccess).toBe(false)
    if (!result.isSuccess) {
      expect(result.message).toContain(
        "صيغة الملف غير مدعومة. يرجى استخدام PNG أو JPEG أو WebP"
      )
    }
  })

  // Test case 4: A request with no file should be rejected.
  it("should return an error if no file is provided", async () => {
    const formData = new FormData() // Empty FormData

    const result = await validateFileAction(formData)

    expect(result.isSuccess).toBe(false)
    if (!result.isSuccess) {
      expect(result.message).toBe("لم يتم العثور على ملف.")
    }
  })
})