import os
import pymupdf
import pandas as pd
import cv2
import numpy as np

def create_synthetic_fixtures(target_dir: str):
    os.makedirs(target_dir, exist_ok=True)
    
    # 1. Create Readable GA PDF with components
    pdf_path = os.path.join(target_dir, "sample_ga.pdf")
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842) # A4 size
    
    page.insert_text((50, 100), "POWER SUPPLY UNIT PS12 24VDC", fontsize=12)
    page.insert_text((50, 150), "CIRCUIT BREAKER CB43 10A", fontsize=12)
    page.insert_text((50, 200), "CIRCUIT BREAKER CB44 16A", fontsize=12)
    page.insert_text((50, 250), "LABEL 1CBP03 MAIN ENCLOSURE", fontsize=12)
    page.insert_text((50, 300), "TERMINAL BLOCK X3 GROUND BUS", fontsize=12)
    
    doc.save(pdf_path)
    doc.close()
    
    # 2. Create Scanned (Image-Only) GA PDF without text
    scanned_pdf_path = os.path.join(target_dir, "scanned_ga.pdf")
    doc_scan = pymupdf.open()
    page_scan = doc_scan.new_page(width=595, height=842)
    page_scan.draw_rect(pymupdf.Rect(100, 100, 200, 200), color=(0, 0, 0), fill=(0.8, 0.8, 0.8))
    doc_scan.save(scanned_pdf_path)
    doc_scan.close()
    
    # 3. Create Excel Wire List Spreadsheet
    excel_path = os.path.join(target_dir, "sample_wire_list.xlsx")
    wire_data = [
        {
            "Component Tag": "PS12",
            "Wire ID": "W-01",
            "From": "PS12",
            "To": "CB43",
            "Wire Colour": "RED",
            "Label": "1CBP03",
            "Ferrule": "F-PS12-01",
            "Terminal": "TB1"
        },
        {
            "Component Tag": "CB43",
            "Wire ID": "W-02",
            "From": "CB43",
            "To": "CB44",
            "Wire Colour": "BLACK",
            "Label": "2CBP01",
            "Ferrule": "F-CB43-02",
            "Terminal": "TB2"
        },
        {
            "Component Tag": "CB44",
            "Wire ID": "W-03",
            "From": "CB44",
            "To": "X3",
            "Wire Colour": "BLUE",
            "Label": "3CBP02",
            "Ferrule": "X3",
            "Terminal": "X3"
        }
    ]
    df = pd.DataFrame(wire_data)
    df.to_excel(excel_path, index=False, sheet_name="WireList")

    # 4. Create Synthetic Cabinet Image (SUITABLE Quality)
    img_path = os.path.join(target_dir, "sample_cabinet.jpg")
    img = np.zeros((600, 800, 3), dtype=np.uint8) + 180 # Light gray cabinet background
    
    # Draw component rectangles and text
    cv2.rectangle(img, (100, 80), (300, 180), (50, 50, 50), -1) # PS12
    cv2.putText(img, "PS12", (120, 140), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)

    cv2.rectangle(img, (350, 80), (550, 180), (60, 60, 60), -1) # CB43
    cv2.putText(img, "CB43", (370, 140), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)

    cv2.rectangle(img, (100, 240), (300, 340), (60, 60, 60), -1) # CB44
    cv2.putText(img, "CB44", (120, 300), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)

    cv2.rectangle(img, (350, 240), (550, 340), (40, 40, 40), -1) # 1CBP03 Label
    cv2.putText(img, "1CBP03", (360, 300), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

    cv2.imwrite(img_path, img)

    # 5. Create Dark Synthetic Cabinet Image
    dark_path = os.path.join(target_dir, "dark_cabinet.jpg")
    dark_img = np.zeros((400, 400, 3), dtype=np.uint8) + 15 # Dark image
    cv2.imwrite(dark_path, dark_img)

if __name__ == "__main__":
    fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
    sample_dir = os.path.join(os.path.dirname(__file__), "../../data/sample")
    create_synthetic_fixtures(fixtures_dir)
    create_synthetic_fixtures(sample_dir)
    print("Synthetic test fixtures created successfully!")
