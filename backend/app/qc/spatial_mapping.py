from typing import List, Tuple, Optional, Dict, Any
from ..schemas.expected_model import ExpectedComponent
from ..schemas.observed_model import ObservedComponent, BoundingBox

class SpatialMappingService:
    """
    Abstractions for spatial positioning and ordering.
    Distinguishes GA PDF coordinates from Photograph pixel coordinates.
    Calculates relative order and spatial relationships.
    """

    @staticmethod
    def get_relative_order_rank(component: ObservedComponent) -> float:
        """
        Calculates a 1D scalar spatial rank for ordering components.
        Top-to-bottom primary, Left-to-right secondary.
        Y coordinate is weighted higher to cluster rows.
        """
        # Primary axis: row/Y position (weight = 10.0), Secondary: column/X position
        return component.center_y * 10.0 + component.center_x

    @classmethod
    def sort_observed_components(cls, components: List[ObservedComponent]) -> List[ObservedComponent]:
        """
        Sorts observed components in standard reading order (top-to-bottom, left-to-right).
        """
        return sorted(components, key=cls.get_relative_order_rank)

    @staticmethod
    def is_above(comp_a: ObservedComponent, comp_b: ObservedComponent, threshold: float = 0.05) -> bool:
        """
        Checks if component A is visually above component B in photograph coordinates.
        Note: In image coordinates, smaller Y means closer to top.
        """
        return (comp_b.center_y - comp_a.center_y) > threshold

    @staticmethod
    def is_left_of(comp_a: ObservedComponent, comp_b: ObservedComponent, threshold: float = 0.05) -> bool:
        """
        Checks if component A is visually left of component B in photograph coordinates.
        """
        return (comp_b.center_x - comp_a.center_x) > threshold

    @classmethod
    def verify_order_pair(
        cls,
        first_comp: ObservedComponent,
        second_comp: ObservedComponent
    ) -> Tuple[bool, str]:
        """
        Verifies that first_comp appears before second_comp in photograph spatial sequence.
        Returns (is_valid, explanation_message).
        """
        rank_first = cls.get_relative_order_rank(first_comp)
        rank_second = cls.get_relative_order_rank(second_comp)

        if rank_first < rank_second:
            return True, f"Observed '{first_comp.tag or first_comp.detection_id}' precedes '{second_comp.tag or second_comp.detection_id}' correctly."
        else:
            return False, f"Observed spatial inversion: '{second_comp.tag or second_comp.detection_id}' (rank {rank_second:.2f}) appears before '{first_comp.tag or first_comp.detection_id}' (rank {rank_first:.2f})."
