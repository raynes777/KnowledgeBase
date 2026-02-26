package node;

import java.util.Collection;
import java.util.stream.Stream;

import content.Content;
import node.visitor.NodeVisitor;

public interface Node {

	Node parent();
	
	Collection<Node> children();

	Content<?> content();
	
	void addChild(Node newChild);
	
	<T> T accept(NodeVisitor<T> visitor);
	
    default Stream<Node> flattened() {
        return Stream.concat(
                Stream.of(this),
                children().stream().filter(i -> !(i.equals(RootNode.getInstance()))).flatMap(Node::flattened));
    }
    
	public static abstract class builder<T extends Node> {

		public abstract T build();
		
	
		
	}
	

}
