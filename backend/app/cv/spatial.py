from typing import List, Tuple
from ..schemas.observed_model import ObservedComponent, BoundingBox

class SpatialAnalyzer:
    """
    Spatial geometry and relative layout analysis for detected components.
    """

    @staticmethod
    def calculate_center_normalized(bbox: BoundingBox, img_w: int, img_h: int) -> Tuple[float, float]:
        """
        Calculates 0.0 - 1.0 normalized center coordinates.
        """
        if img_w <= 0 or img_h <= 0:
            return 0.0, 0.0
        norm_x = bbox.center_x / float(img_w)
        norm_y = bbox.center_y / float(img_h)
        return round(norm_x, 4), round(norm_y, 4)

    @staticmethod
    def assign_spatial_grid(components: List[ObservedComponent], row_tolerance_px: float = 60.0) -> List[ObservedComponent]:
        """
        Sorts components spatially into estimated rows (top-to-bottom) and columns (left-to-right).
        """
        if not components:
            return components

        # Sort primarily by center_y (vertical alignment)
        sorted_by_y = sorted(components, key=lambda c: c.bounding_box.center_y)

        rows: List[List[ObservedComponent]] = []
        for comp in sorted_by_y:
            placed = False
            cy = comp.bounding_box.center_y
            for row in rows:
                # Compare with average y of existing row
                row_y = sum(c.bounding_box.center_y for c in row) / len(row)
                if abs(cy - row_y) <= row_tolerance_px:
                    row.append(comp)
                    placed = True
                    break
            if not placed:
                rows.append([comp])

        # Sort each row horizontally (left to right) and assign row_index / col_index
        for row_idx, row in enumerate(rows, start=1):
            row_sorted = sorted(row, key=lambda c: c.bounding_box.center_x)
            for col_idx, comp in enumerate(row_sorted, start=1):
                comp.row_index = row_idx
                comp.col_index = col_idx

        return components

    @staticmethod
    def find_nearest_component(label_bbox: BoundingBox, components: List[ObservedComponent]) -> Tuple[ObservedComponent, float]:
        """
        Finds the nearest detected component to a label region based on Euclidean distance.
        """
        if not components:
            return None, float('inf')

        best_comp = None
        min_dist = float('inf')

        l_cx = label_bbox.center_x
        l_cy = label_bbox.center_y

        for comp in components:
            c_cx = comp.bounding_box.center_x
            c_cy = comp.bounding_box.center_y
            dist = ((l_cx - c_cx)**2 + (l_cy - c_cy)**2) ** 0.5
            if dist < min_dist:
                min_dist = dist
                best_comp = comp

        return best_comp, min_dist
