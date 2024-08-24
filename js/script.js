// 캔버스 초기화 및 배경색 설정
const canvas = new fabric.Canvas("canvas", {
	width: 800,
	height: 600,
})
canvas.setBackgroundColor("#fff", canvas.renderAll.bind(canvas))

// 초기 설정
canvas.isDrawingMode = true
canvas.freeDrawingBrush.width = 5
canvas.freeDrawingBrush.color = "black"
document.getElementById("brush-preview").style.backgroundColor = canvas.freeDrawingBrush.color
let currentTool = "brush"

// 모달 창
const modal = document.getElementById("modal")
const modalMessage = document.getElementById("modal-message")
const closeModal = document.getElementById("close-modal")

function closeModalWindow() {
	modal.style.display = "none"
}

closeModal.onclick = closeModalWindow

function showModal(message, duration = 1000) {
	modalMessage.textContent = message
	modal.style.display = "block"
	setTimeout(closeModalWindow, duration)
}

// 브러시 크기 조절
document.getElementById("brush-size").addEventListener("input", function () {
	const size = Math.min(parseInt(this.value, 10), 30) // 최대 크기 30
	updateBrushSize(size)
})

function increaseBrushSize() {
	const currentSize = canvas.freeDrawingBrush.width
	const newSize = Math.min(currentSize + 1, 30) // 최대 크기 30
	updateBrushSize(newSize)
}

function decreaseBrushSize() {
	const currentSize = canvas.freeDrawingBrush.width
	const newSize = Math.max(currentSize - 1, 1) // 최소 크기 1
	updateBrushSize(newSize)
}

function updateBrushSize(size) {
	const constrainedSize = Math.min(size, 30)
	canvas.freeDrawingBrush.width = constrainedSize
	const preview = document.getElementById("brush-preview")
	preview.style.width = constrainedSize + "px"
	preview.style.height = constrainedSize + "px"
	document.getElementById("brush-size").value = constrainedSize
}

// 색상 선택 input 클릭 시 색상 선택 input 열기
document.getElementById("brush-preview").addEventListener("click", function () {
	document.getElementById("color-picker").click()
})

document.getElementById("color-picker").addEventListener("input", function () {
	const color = this.value
	if (currentTool === "brush" || currentTool === "line") {
		canvas.freeDrawingBrush.color = color
		document.getElementById("brush-preview").style.backgroundColor = color
		canvas.isDrawingMode = currentTool === "brush"
		canvas.selection = false
		disableObjectMovement()
	}
})

// 브러시 툴 선택
document.getElementById("brush-tool").addEventListener("click", function () {
	currentTool = "brush"
	canvas.isDrawingMode = true
	canvas.selection = false
	disableObjectMovement()
})

// 직선 툴 선택
document.getElementById("line-tool").addEventListener("click", function () {
	currentTool = "line"
	canvas.isDrawingMode = false
	canvas.selection = false
	disableObjectMovement()
})

// 선택 툴 선택
document.getElementById("select-tool").addEventListener("click", function () {
	currentTool = "select"
	canvas.isDrawingMode = false
	canvas.selection = true
	enableObjectMovement()
})

function disableObjectMovement() {
	canvas.getObjects().forEach((obj) => {
		obj.selectable = false
		obj.evented = false
	})
}

function enableObjectMovement() {
	canvas.getObjects().forEach((obj) => {
		obj.selectable = true
		obj.evented = true
	})
}

// 먼셀 색상 버튼 클릭 시 색상 적용
document.querySelectorAll(".color-btn").forEach((button) => {
	button.addEventListener("click", function () {
		const color = this.style.backgroundColor
		canvas.freeDrawingBrush.color = color
		document.getElementById("brush-preview").style.backgroundColor = color
		currentTool = "brush"
		canvas.isDrawingMode = true
		canvas.selection = false
		disableObjectMovement()
	})
})

// 선택한 객체 삭제 버튼
document.getElementById("delete-object").addEventListener("click", function () {
	deleteSelectedObjects()
})

document.addEventListener("keydown", function (event) {
	if ((event.key === "Delete" || event.key === "Backspace") && currentTool === "select") {
		deleteSelectedObjects()
	}
})

function deleteSelectedObjects() {
	const activeObjects = canvas.getActiveObjects()
	if (activeObjects.length) {
		activeObjects.forEach((obj) => canvas.remove(obj))
		canvas.discardActiveObject()
		canvas.requestRenderAll()
	}
}

// 캔버스 초기화
document.getElementById("clear-canvas").addEventListener("click", function () {
	canvas.clear()
	showModal("Canvas cleared.")
	canvas.setBackgroundColor("#fff", canvas.renderAll.bind(canvas))
})

// 클립보드에 이미지 복사
document.getElementById("copy-to-clipboard").addEventListener("click", copyToClipboard)

async function copyToClipboard() {
	try {
		const dataUrl = canvas.toDataURL("image/png")
		const blob = await (await fetch(dataUrl)).blob()
		const item = new ClipboardItem({ "image/png": blob })
		await navigator.clipboard.write([item])
		showModal("Image copied to clipboard.")
	} catch (err) {
		console.error("Failed to copy image to clipboard:", err)
		showModal("Failed to copy image to clipboard.")
	}
}

// 이미지 저장
document.getElementById("save-image").addEventListener("click", saveImage)

function saveImage() {
	const format = document.getElementById("image-format").value
	const dataUrl = canvas.toDataURL(`image/${format}`)
	const link = document.createElement("a")
	link.href = dataUrl
	link.download = `canvas-image.${format}`
	link.click()
	showModal(`Image saved as ${format}.`)
}

// 직선 툴 구현
canvas.on("mouse:down", function (o) {
	if (currentTool === "line") {
		const pointer = canvas.getPointer(o.e)
		const points = [pointer.x, pointer.y, pointer.x, pointer.y]
		const line = new fabric.Line(points, {
			strokeWidth: canvas.freeDrawingBrush.width,
			fill: canvas.freeDrawingBrush.color,
			stroke: canvas.freeDrawingBrush.color,
			originX: "center",
			originY: "center",
		})
		canvas.add(line)
		canvas.on("mouse:move", function (o) {
			const pointer = canvas.getPointer(o.e)
			line.set({ x2: pointer.x, y2: pointer.y })
			canvas.renderAll()
		})
		canvas.on("mouse:up", function () {
			canvas.off("mouse:move")
			canvas.off("mouse:up")
		})
	}
})

// 클립보드에서 이미지 붙여넣기
document.getElementById("paste-from-clipboard").addEventListener("click", pasteFromClipboard)

async function pasteFromClipboard() {
	try {
		const clipboardItems = await navigator.clipboard.read()
		for (const item of clipboardItems) {
			if (!item.types.includes("image/png")) continue
			const blob = await item.getType("image/png")
			const url = URL.createObjectURL(blob)
			fabric.Image.fromURL(url, function (img) {
				canvas.add(img)
				canvas.setWidth(img.width)
				canvas.setHeight(img.height)
				document.getElementById("canvas-width").value = img.width
				document.getElementById("canvas-height").value = img.height
			})
		}
		showModal("Image pasted from clipboard.")
	} catch (err) {
		console.error("Failed to paste image from clipboard:", err)
		showModal("Failed to paste image from clipboard.")
	}
}

// 캔버스 크기 조절
document.getElementById("resize-canvas").addEventListener("click", function () {
	const width = document.getElementById("canvas-width").value
	const height = document.getElementById("canvas-height").value
	canvas.setWidth(parseInt(width, 10))
	canvas.setHeight(parseInt(height, 10))
	canvas.renderAll()
	showModal(`Canvas resized to ${width}x${height}.`)
})

// 단축키로 도구 선택 및 색상 변경
document.addEventListener("keydown", function (event) {
	if ((event.metaKey || event.ctrlKey) && event.code === "KeyR") {
		event.preventDefault() // 기본 동작 방지 (브라우저 새로고침 등)
		return // 함수 종료
	}

	// 단독 키 입력 (C, V)에서는 아무 기능도 동작하지 않음
	if (event.code === "KeyC" || event.code === "KeyV") {
		return
	}

	switch (event.code) {
		case "KeyB":
			document.getElementById("brush-tool").click()
			break
		case "KeyL":
			document.getElementById("line-tool").click()
			break
		case "KeyS":
			document.getElementById("select-tool").click()
			break
		case "KeyR":
			document.getElementById("clear-canvas").click()
			break
		case "KeyD":
			document.getElementById("delete-object").click()
			break
		case "Digit1":
		case "Digit2":
		case "Digit3":
		case "Digit4":
		case "Digit5":
		case "Digit6":
		case "Digit7":
		case "Digit8":
		case "Digit9":
		case "Digit0":
			applyColor(event.code)
			break
		case "Equal":
		case "NumpadAdd":
			increaseBrushSize()
			break
		case "Minus":
		case "NumpadSubtract":
			decreaseBrushSize()
			break
	}
})

// 클립보드 복사 및 붙여넣기 단축키 처리
document.addEventListener("keydown", function (event) {
	if ((event.ctrlKey || event.metaKey) && event.code === "KeyC") {
		event.preventDefault()
		copyToClipboard()
	}

	if ((event.ctrlKey || event.metaKey) && event.code === "KeyV") {
		event.preventDefault()
		pasteFromClipboard()
	}
})

function applyColor(digitCode) {
	const colorButtons = {
		Digit1: "color-btn-1",
		Digit2: "color-btn-2",
		Digit3: "color-btn-3",
		Digit4: "color-btn-4",
		Digit5: "color-btn-5",
		Digit6: "color-btn-6",
		Digit7: "color-btn-7",
		Digit8: "color-btn-8",
		Digit9: "color-btn-9",
		Digit0: "color-btn-0",
	}

	const buttonId = colorButtons[digitCode]
	const color = document.getElementById(buttonId).style.backgroundColor

	if (currentTool === "brush") {
		canvas.freeDrawingBrush.color = color
		document.getElementById("brush-preview").style.backgroundColor = color
	} else if (currentTool === "line") {
		canvas.freeDrawingBrush.color = color
		document.getElementById("brush-preview").style.backgroundColor = color
	}
}

document.getElementById("fold").addEventListener("click", function (e) {
	e.preventDefault()
	const contents = document.getElementsByClassName("shortcutClipboard")
	const foldIcon = document.getElementById("fold")

	Array.from(contents).forEach((content) => {
		// 각 요소에 대해 반복문 사용
		if (content.style.display === "none" || content.style.display === "") {
			content.style.display = "flex"
			foldIcon.innerHTML = `<i class="fa-solid fa-angle-up"></i>`
		} else {
			content.style.display = "none"
			foldIcon.innerHTML = `<i class="fa-solid fa-angle-down"></i>`
		}
	})
})
